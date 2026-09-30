/**
 * Everything the Benefits Manager demo fakes, in one place.
 *
 * This page exists for a design discussion, not for production: the starting board, the
 * upkeep tasks and the "unlocked" benefits are all invented. Keeping the inventions here
 * means the components stay honest about what they render, and anyone reading the demo
 * can see at a glance which parts would need a real data source.
 */
import { Program } from '../../../Types/Results';
import { programValue } from '../FormattedValue';
import { BoardState, ColumnId } from './benefitsCodeUtils';

function matches(program: Program, ...needles: string[]): boolean {
  const haystack = `${program.external_name} ${program.name.default_message} ${program.name_abbreviated}`.toLowerCase();
  return needles.some((needle) => haystack.includes(needle));
}

export function isSnap(program: Program): boolean {
  return matches(program, 'snap');
}

/**
 * The board a presenter opens on: mid-journey, so the tracker shows real numbers from the
 * first second instead of two zeros.
 *
 * SNAP goes to Receiving when the household has it, because it carries the most
 * recognizable upkeep task. The single most valuable remaining program stays in Eligible,
 * so "Your Next Application" has something worth pointing at. Tax credits stay in
 * Eligible too — "receiving" a tax credit you claim once a year reads oddly on a board.
 */
export function buildDemoBoardState(programs: Program[], taxCreditIds: Set<number>): BoardState {
  const state: BoardState = {};
  for (const program of programs) {
    state[program.program_id] = 'eligible';
  }

  const snap = programs.find(isSnap);
  if (snap !== undefined) {
    state[snap.program_id] = 'receiving';
  }

  const rest = programs
    .filter((program) => program !== snap && !taxCreditIds.has(program.program_id))
    .sort((a, b) => programValue(b) - programValue(a))
    .slice(1);

  const plan: ColumnId[] = snap !== undefined ? ['applied', 'receiving', 'applied'] : ['applied', 'receiving', 'applied', 'receiving'];
  plan.forEach((column, i) => {
    if (rest[i] !== undefined) {
      state[rest[i].program_id] = column;
    }
  });

  return state;
}

export type UpkeepTask = {
  programId: number;
  title: string;
  cadence: string;
  detail: string;
  confirmQuestion: string;
  due: Date;
};

type UpkeepTemplate = Omit<UpkeepTask, 'programId' | 'due'>;

const UPKEEP_RULES: { needles: string[]; template: UpkeepTemplate }[] = [
  {
    needles: ['snap'],
    template: {
      title: 'Submit your periodic report',
      cadence: 'Every 6 months',
      detail:
        "Halfway through your certification period, SNAP asks for a short report confirming your income and household haven't changed. If it isn't turned in on time, your benefits can stop.",
      confirmQuestion: 'Have you submitted your periodic report?',
    },
  },
  {
    needles: ['medicaid', 'chp', 'health', 'medicare', 'insurance'],
    template: {
      title: 'Renew your health coverage',
      cadence: 'Every year',
      detail:
        'Health coverage has to be renewed once a year. Watch your mail for a renewal packet and send it back by the deadline so there is no gap in coverage.',
      confirmQuestion: 'Have you sent back your renewal packet?',
    },
  },
  {
    needles: ['wic'],
    template: {
      title: 'Recertify at your WIC clinic',
      cadence: 'Every 6 to 12 months',
      detail:
        'WIC asks you to visit your clinic to recertify. Bring proof of income and your WIC card, and book the appointment early — slots fill up.',
      confirmQuestion: 'Have you completed your WIC appointment?',
    },
  },
  {
    needles: ['leap', 'liheap', 'energy', 'utility', 'heating'],
    template: {
      title: 'Reapply before heating season',
      cadence: 'Every year',
      detail:
        'Energy assistance does not renew on its own. Applications open each fall, and funding can run out, so apply as early in the season as you can.',
      confirmQuestion: 'Have you reapplied for this season?',
    },
  },
  {
    needles: ['tanf', 'works'],
    template: {
      title: 'Check in with your caseworker',
      cadence: 'Every month',
      detail:
        'Cash assistance usually comes with a monthly check-in on your work or training activities. Missing one can pause your payments.',
      confirmQuestion: 'Have you completed your check-in?',
    },
  },
  {
    needles: ['ccap', 'child care', 'childcare', 'child_care'],
    template: {
      title: 'Confirm your childcare hours',
      cadence: 'Every 6 months',
      detail:
        'Childcare assistance asks you to confirm your work or school schedule so your approved hours still match what you need.',
      confirmQuestion: 'Have you confirmed your hours?',
    },
  },
];

const DEFAULT_UPKEEP: UpkeepTemplate = {
  title: 'Report any changes',
  cadence: 'Whenever something changes',
  detail:
    'Most benefits ask you to report changes to your income, address or household within 10 days. Reporting early keeps you from owing money back later.',
  confirmQuestion: 'Have you reported your changes?',
};

/** One fake task per program in Receiving, due on staggered dates starting next month. */
export function buildUpkeepTasks(receiving: Program[], now: Date = new Date()): UpkeepTask[] {
  return receiving.map((program, i) => {
    const rule = UPKEEP_RULES.find(({ needles }) => matches(program, ...needles));
    return {
      ...(rule?.template ?? DEFAULT_UPKEEP),
      programId: program.program_id,
      due: new Date(now.getFullYear(), now.getMonth() + 1, 5 + i * 9),
    };
  });
}

export type NewBenefit = {
  id: number;
  name: string;
  value: string;
  description: string;
};

// Shown whenever anything moves to Receiving. In a real version these would come from
// the API (e.g. categorical eligibility), which is exactly the design question.
export const DEMO_UNLOCKED_BENEFITS: NewBenefit[] = [
  {
    id: 9001,
    name: 'Weatherization Assistance Program',
    value: '$450/year',
    description:
      'Free home energy upgrades including insulation, air sealing, and furnace repair to reduce utility bills.',
  },
  {
    id: 9002,
    name: 'Free School Meals',
    value: '$180/month',
    description:
      'Automatic eligibility for free breakfast and lunch for all children in the household at participating schools.',
  },
  {
    id: 9003,
    name: 'Childcare Assistance',
    value: '$600/month',
    description:
      'Subsidized childcare for eligible families, covering a significant portion of daycare and after-school program costs.',
  },
];

/** A Program-shaped stand-in for an unlocked benefit, so the detail view can open it. */
export function newBenefitAsProgram(benefit: NewBenefit): Program {
  const text = (key: string, message: string) => ({ label: `benefitsManagerDemo.${benefit.id}.${key}`, default_message: message });

  return {
    program_id: benefit.id,
    name: text('name', benefit.name),
    name_abbreviated: benefit.name,
    external_name: `demo_new_benefit_${benefit.id}`,
    estimated_value: 0,
    household_value: 0,
    estimated_delivery_time: text('delivery', '2-4 weeks'),
    estimated_application_time: text('applicationTime', 'Auto-enrolled'),
    description_short: text('descriptionShort', benefit.description),
    description: text('description', benefit.description),
    learn_more_link: text('learnMore', ''),
    apply_button_link: text('apply', ''),
    apply_button_description: text('applyDescription', ''),
    legal_status_required: [],
    estimated_value_override: text('valueOverride', benefit.value),
    eligible: true,
    members: [],
    failed_tests: [],
    passed_tests: [],
    already_has: false,
    new: true,
    low_confidence: false,
    navigators: [],
    documents: [],
    warning_messages: [],
    required_programs: [],
    value_format: null,
  };
}
