#!/usr/bin/env node
/**
 * Translation key parity check.
 *
 * A missing translation key is invisible to an English-speaking reviewer:
 * react-intl silently falls back to the `defaultMessage` in the JSX, so the app
 * looks perfectly fine while every non-English user sees English. That is how
 * MFB-1642 happened - 50 keys had accumulated across several refactors, and the
 * only reason anyone noticed was a partner complaining months later.
 *
 * Checks, in order of severity:
 *
 *   MISSING   (fails)  an ID the frontend requests that has no Translation record
 *   MANGLED   (fails)  a translation whose ICU placeholders differ from the English
 *   DEAD      (warns)  a DB key nothing in the frontend requests any more
 *   ENGLISH   (warns)  a non-English value byte-identical to the English
 *
 * MANGLED is here because MFB-1733 found 18 keys live in production whose
 * placeholders had been renamed or dropped by machine translation ({subject} ->
 * {sujeto}), leaving values react-intl can never resolve. That is a different
 * failure from a missing key and needs its own check.
 *
 * KNOWN BLIND SPOT - config-driven labels
 * ---------------------------------------
 * Not every message id appears in the source. White-label config delivers labels
 * as `{_label, _default_message}` pairs and src/Components/Config/configHook.tsx
 * turns them into a FormattedMessage at runtime, so a static AST walk cannot see
 * them at all. `acuteConditionOptions.*`, `relationshipOptions.*`,
 * `healthInsuranceOptions.*` and `moreHelp.*` all work this way.
 *
 * Two consequences, both real:
 *
 *   - A missing config-driven label is NOT caught here. MFB-1686 was exactly that
 *     (`acuteConditionOptions.homelessServices` declared in nc.py, no Translation
 *     record, rendering English for months).
 *   - Those keys show up as "dead" because nothing in the source requests them,
 *     which is why the allowlist carries a long `dead` list. Treat DEAD as
 *     advisory only.
 *
 * Closing the gap properly means checking the white-label config in benefits-api
 * against the DB as well - a backend check, and a separate piece of work.
 *
 * Usage:
 *   node scripts/check-translation-keys.mjs                     # fetch from API
 *   node scripts/check-translation-keys.mjs --export path.json  # use a bulk_export
 *   node scripts/check-translation-keys.mjs --json              # machine-readable
 *
 * Env: TRANSLATIONS_API_URL, TRANSLATIONS_API_KEY
 */

import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const SRC = 'src';
const ALLOWLIST_PATH = 'scripts/translation-keys-allowlist.json';

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name) => {
  const i = args.indexOf(name);
  return i === -1 ? undefined : args[i + 1];
};

/* ------------------------------------------------------------------ extract */

/**
 * Walk every source file's AST and collect react-intl message descriptors.
 *
 * An AST walk rather than a regex over `id=`: plain HTML element ids
 * (`income-section`, `nav-container`, `hamburger-drawer`) are indistinguishable
 * from message ids by pattern alone, and a naive regex reports dozens of them as
 * missing translations. Only `<FormattedMessage>` elements and
 * `formatMessage({...})` calls count here.
 */
function extractFrontendIds() {
  const found = new Map(); // id -> { defaultMessage, files:Set }

  const record = (id, defaultMessage, file) => {
    if (!id) return;
    const existing = found.get(id);
    if (existing) {
      existing.files.add(file);
      // Two call sites disagreeing on the English is worth knowing about: the DB
      // can only hold one value, so one of them is silently wrong.
      if (defaultMessage && existing.defaultMessage && defaultMessage !== existing.defaultMessage) {
        existing.conflict = true;
      }
      if (defaultMessage && !existing.defaultMessage) existing.defaultMessage = defaultMessage;
      return;
    }
    found.set(id, { defaultMessage, files: new Set([file]), conflict: false });
  };

  // Reads a string that must be statically known. A template literal with
  // interpolation cannot be resolved here, so it is reported rather than guessed.
  const staticString = (node) => {
    if (!node) return undefined;
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
    return undefined;
  };

  const dynamicIds = [];

  const fromObjectLiteral = (obj, file) => {
    if (!obj || !ts.isObjectLiteralExpression(obj)) return;
    let id;
    let defaultMessage;
    let idNode;
    let hasDefaultMessage = false;
    for (const prop of obj.properties) {
      if (!ts.isPropertyAssignment(prop) || !prop.name) continue;
      const key = ts.isIdentifier(prop.name) || ts.isStringLiteral(prop.name) ? prop.name.text : undefined;
      if (key === 'id') {
        id = staticString(prop.initializer);
        idNode = prop.initializer;
      }
      if (key === 'defaultMessage') {
        hasDefaultMessage = true;
        defaultMessage = staticString(prop.initializer);
      }
    }
    // BOTH keys are required. `id` alone is far too common to be a useful signal -
    // plenty of unrelated objects carry one - whereas `id` + `defaultMessage`
    // together is the react-intl MessageDescriptor shape and essentially nothing
    // else. Without this guard, matching on shape floods the report with noise.
    if (!hasDefaultMessage) return;
    if (id) record(id, defaultMessage, file);
    else if (idNode) dynamicIds.push({ file, text: idNode.getText() });
  };

  const walkFile = (file) => {
    const source = ts.createSourceFile(
      file,
      fs.readFileSync(file, 'utf8'),
      ts.ScriptTarget.Latest,
      true,
      file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    );

    const visit = (node) => {
      // <FormattedMessage id="..." defaultMessage="..." />
      if (ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) {
        const tag = node.tagName.getText();
        if (tag === 'FormattedMessage') {
          let id;
          let defaultMessage;
          let idNode;
          for (const attr of node.attributes.properties) {
            if (!ts.isJsxAttribute(attr) || !attr.name) continue;
            const name = attr.name.getText();
            let valueNode = attr.initializer;
            if (valueNode && ts.isJsxExpression(valueNode)) valueNode = valueNode.expression;
            if (name === 'id') {
              id = staticString(valueNode);
              idNode = valueNode;
            }
            if (name === 'defaultMessage') defaultMessage = staticString(valueNode);
          }
          if (id) record(id, defaultMessage, file);
          else if (idNode) dynamicIds.push({ file, text: idNode.getText() });
        }
      }

      // Any object literal carrying both `id` and `defaultMessage` is a react-intl
      // MessageDescriptor. Matching on the shape rather than on `formatMessage(...)`
      // call sites is deliberate: descriptors are routinely hoisted to a variable
      // and passed by reference, e.g. in CclaFooter.tsx
      //
      //   const cclaPrivacyPolicyALProps = { id: 'cclaFooter...AL', defaultMessage: '...' };
      //   aria-label={intl.formatMessage(cclaPrivacyPolicyALProps)}
      //
      // which a call-site-only walk sees as formatMessage(identifier) and records
      // nothing. That produced two wrong answers: those keys were reported as dead
      // while being actively used, and - worse - a hoisted descriptor with no
      // Translation record would not have been flagged as missing at all. The
      // codebase uses this shape widely for aria-labels. Matching on shape also
      // covers defineMessages({...}) blocks for free.
      if (ts.isObjectLiteralExpression(node)) {
        fromObjectLiteral(node, file);
      }

      ts.forEachChild(node, visit);
    };

    visit(source);
  };

  const walkDir = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules') continue;
        walkDir(full);
        continue;
      }
      if (!/\.tsx?$/.test(entry.name)) continue;
      if (/\.(test|spec)\./.test(entry.name)) continue;
      if (/\.d\.ts$/.test(entry.name)) continue;
      walkFile(full);
    }
  };

  walkDir(SRC);
  return { found, dynamicIds };
}

/* ----------------------------------------------------------------- db source */

async function loadDbTranslations() {
  const exportPath = opt('--export');

  if (exportPath) {
    // bulk_export shape: { translations: { label: { langs: { lang: [text, edited] } } } }
    const raw = JSON.parse(fs.readFileSync(exportPath, 'utf8').split('\n')[0]);
    const out = new Map();
    for (const [label, entry] of Object.entries(raw.translations ?? {})) {
      const langs = {};
      for (const [lang, value] of Object.entries(entry.langs ?? {})) {
        langs[lang] = Array.isArray(value) ? value[0] : value;
      }
      out.set(label, langs);
    }
    return { keys: out, source: `export ${exportPath}` };
  }

  const url = process.env.TRANSLATIONS_API_URL;
  const key = process.env.TRANSLATIONS_API_KEY;
  if (!url) {
    console.error(
      'No key source. Set TRANSLATIONS_API_URL (and TRANSLATIONS_API_KEY), or pass --export <bulk_export.json>.',
    );
    process.exit(2);
  }

  // The API returns one language at a time, so every language is fetched to be
  // able to compare placeholders and spot untranslated values.
  // Mirrors src/apiCalls.ts, which stores the bare DRF token and prepends the
  // scheme: `const apiKey = 'Token ' + process.env.REACT_APP_API_KEY`. Storing the
  // bare token means the CI secret is a straight copy of the existing
  // REACT_APP_API_KEY Heroku config value. A value that already carries the scheme
  // is accepted too, so either form works.
  const headers = { Accept: 'application/json' };
  if (key) headers.Authorization = key.startsWith('Token ') ? key : `Token ${key}`;

  // TranslationView returns Translation.objects.all_translations([lang]), which is
  // keyed by language: {"en-us": {label: text, ...}}. Unwrap that one level rather
  // than assuming a flat map - reading it flat yields exactly one "key" named after
  // the language and reports every real id as missing.
  const fetchLang = async (lang) => {
    const response = await fetch(`${url}?lang=${lang}`, { headers });
    if (!response.ok) throw new Error(`${lang}: ${response.status} ${response.statusText}`);
    const body = await response.json();
    const inner = body?.[lang];
    if (inner && typeof inner === 'object') return inner;
    // Tolerate a flat response too, so a future API change does not silently
    // report every id as missing.
    return body ?? {};
  };

  let english;
  try {
    english = await fetchLang('en-us');
  } catch (error) {
    // Deliberately a hard failure, not a skip. A check that quietly passes when
    // it could not run is worse than no check - it reads as a green tick.
    console.error(`\nCould not reach the translations API: ${error.message}`);
    console.error('This is an infrastructure problem, not a problem with your changes.');
    console.error('Re-run the job; if it keeps failing, check the API is up and the key is set.\n');
    process.exit(2);
  }

  const langs = (opt('--langs') ?? 'es,vi,fr,am,so,ru,ne,my,zh-hans,ar,sw,pl,tl,ko,ur,pt-br,ht').split(',');
  const byLabel = new Map();
  for (const [label, text] of Object.entries(english)) byLabel.set(label, { 'en-us': text });

  const results = await Promise.allSettled(langs.map((lang) => fetchLang(lang).then((data) => [lang, data])));
  const unreachable = [];
  for (const result of results) {
    if (result.status !== 'fulfilled') {
      unreachable.push(result.reason?.message ?? 'unknown');
      continue;
    }
    const [lang, data] = result.value;
    for (const [label, text] of Object.entries(data)) {
      if (byLabel.has(label)) byLabel.get(label)[lang] = text;
    }
  }
  if (unreachable.length) {
    console.error(`Warning: could not fetch ${unreachable.length} language(s): ${unreachable.join(', ')}`);
    console.error('Placeholder and untranslated checks will be incomplete for those.\n');
  }

  return { keys: byLabel, source: url };
}

/* -------------------------------------------------------------------- checks */

const PLACEHOLDER_RE = /\{[^{}]*\}/g;
const ICU_ARG_RE = /\{\s*(\w+)/g;

const placeholderNames = (text) => {
  const names = [];
  for (const match of (text ?? '').matchAll(ICU_ARG_RE)) names.push(match[1]);
  return names.filter((n) => !['plural', 'select', 'selectordinal'].includes(n)).sort();
};

const sameMultiset = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

function loadAllowlist() {
  if (!fs.existsSync(ALLOWLIST_PATH)) return { missing: [], dead: [], english: [] };
  const raw = JSON.parse(fs.readFileSync(ALLOWLIST_PATH, 'utf8'));
  return { missing: raw.missing ?? [], dead: raw.dead ?? [], english: raw.english ?? [] };
}

const matches = (patterns, key) =>
  patterns.some((pattern) => (pattern.endsWith('*') ? key.startsWith(pattern.slice(0, -1)) : pattern === key));

async function main() {
  const { found, dynamicIds } = extractFrontendIds();
  const { keys: db, source } = await loadDbTranslations();
  const allow = loadAllowlist();

  const missing = [];
  const mangled = [];
  const untranslated = [];

  for (const [id, meta] of found) {
    if (!db.has(id)) {
      if (!matches(allow.missing, id)) missing.push({ id, files: [...meta.files] });
      continue;
    }
    const langs = db.get(id);
    const english = langs['en-us'] ?? '';
    if (!english.includes('{')) {
      for (const [lang, text] of Object.entries(langs)) {
        if (lang === 'en-us' || !text) continue;
        if (text.trim() === english.trim() && !matches(allow.english, id)) {
          untranslated.push({ id, lang });
        }
      }
      continue;
    }
    const expected = placeholderNames(english);
    for (const [lang, text] of Object.entries(langs)) {
      if (lang === 'en-us' || !text) continue;
      if (!sameMultiset(placeholderNames(text), expected)) {
        mangled.push({ id, lang, english, got: text });
      }
    }
  }

  const dead = [...db.keys()].filter((key) => !found.has(key) && !matches(allow.dead, key));

  const conflicts = [...found.entries()]
    .filter(([, meta]) => meta.conflict)
    .map(([id, meta]) => ({ id, files: [...meta.files] }));

  if (flag('--json')) {
    console.log(JSON.stringify({ source, missing, mangled, dead, untranslated, conflicts, dynamicIds }, null, 2));
  } else {
    console.log(`Translation key check - ${found.size} frontend ids vs ${db.size} DB keys (${source})\n`);

    if (missing.length) {
      console.log(`FAIL  ${missing.length} id(s) requested by the frontend with no Translation record.`);
      console.log('      These render English in every language. Add them with add_translations.');
      for (const { id, files } of missing) console.log(`        ${id}  (${files.join(', ')})`);
      console.log('');
    }

    if (mangled.length) {
      const ids = new Set(mangled.map((m) => m.id));
      console.log(`FAIL  ${mangled.length} translation(s) across ${ids.size} key(s) have altered ICU placeholders.`);
      console.log('      The placeholder will never resolve, so the value renders wrong. See MFB-1733.');
      for (const { id, lang, english, got } of mangled.slice(0, 20)) {
        console.log(`        ${id} [${lang}]`);
        console.log(`          en: ${JSON.stringify(english)}`);
        console.log(`          ${lang}: ${JSON.stringify(got)}`);
      }
      if (mangled.length > 20) console.log(`        ... and ${mangled.length - 20} more`);
      console.log('');
    }

    if (conflicts.length) {
      console.log(`WARN  ${conflicts.length} id(s) used with different defaultMessage at different call sites.`);
      console.log('      The DB holds one value, so one call site is silently wrong.');
      for (const { id, files } of conflicts) console.log(`        ${id}  (${files.join(', ')})`);
      console.log('');
    }

    if (dynamicIds.length) {
      console.log(`WARN  ${dynamicIds.length} message id(s) are computed at runtime and cannot be checked here.`);
      for (const { file, text } of dynamicIds.slice(0, 10)) console.log(`        ${file}: ${text}`);
      console.log('');
    }

    if (dead.length) {
      console.log(`WARN  ${dead.length} DB key(s) no longer requested by the frontend.`);
      console.log('      Harmless, but they accumulate. Worth pruning periodically.');
      for (const key of dead.slice(0, 15)) console.log(`        ${key}`);
      if (dead.length > 15) console.log(`        ... and ${dead.length - 15} more`);
      console.log('');
    }

    if (untranslated.length) {
      const byLang = {};
      for (const { lang } of untranslated) byLang[lang] = (byLang[lang] ?? 0) + 1;
      console.log(`WARN  ${untranslated.length} value(s) byte-identical to the English.`);
      console.log('      Some are correct ("SNAP", proper nouns); many are simply untranslated.');
      console.log(
        `        ${Object.entries(byLang)
          .sort((a, b) => b[1] - a[1])
          .map(([lang, count]) => `${lang}:${count}`)
          .join('  ')}`,
      );
      console.log('');
    }

    if (!missing.length && !mangled.length) {
      console.log('PASS  no missing keys, no mangled placeholders.');
    }
  }

  // process.exitCode rather than process.exit(): process.exit() tears the process
  // down without waiting for stdout to drain, which truncates the report whenever
  // output is piped (found by piping --json into a parser and getting a JSON
  // syntax error mid-object). Setting the code lets Node exit naturally once the
  // stream has flushed.
  process.exitCode = missing.length || mangled.length ? 1 : 0;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 2;
});
