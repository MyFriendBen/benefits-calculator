import { FormattedMessage } from 'react-intl';
import { resourceNameFromConfig, Resource } from './MoreHelp';

// resourceNameFromConfig picks the analytics resource_name for a more-help
// resource: an explicit `label` wins, else the translation id from a
// FormattedMessage `name`, else undefined. It must NOT read `id` off any other
// element type (that could leak an unrelated DOM id as the resource name).

const resource = (over: Partial<Resource>): Resource => ({
  name: <FormattedMessage id="moreHelp.default" defaultMessage="Default" />,
  ...over,
});

describe('resourceNameFromConfig', () => {
  it('prefers an explicit label', () => {
    expect(resourceNameFromConfig(resource({ label: 'my-label' }))).toBe('my-label');
  });

  it('falls back to the FormattedMessage translation id', () => {
    expect(
      resourceNameFromConfig(resource({ name: <FormattedMessage id="moreHelp.two11" defaultMessage="2-1-1" /> })),
    ).toBe('moreHelp.two11');
  });

  it('does NOT read id off a non-FormattedMessage element', () => {
    // A differently-shaped `name` with an unrelated id must not leak that id.
    expect(resourceNameFromConfig(resource({ name: <div id="not-a-resource-name">x</div> }))).toBeUndefined();
  });

  it('returns undefined when there is no label and no usable name', () => {
    expect(resourceNameFromConfig(resource({ name: <span>plain</span> }))).toBeUndefined();
  });
});
