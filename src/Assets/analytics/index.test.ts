import { trackItemList } from './index';

// GA4 fabricates a single all-"(not set)" item for a view_item_list sent with an
// empty items array, which reads downstream as a phantom program. trackItemList
// must skip the impression entirely when nothing was shown, and still emit
// normally when there are items.

describe('trackItemList empty-items guard', () => {
  beforeEach(() => {
    window.dataLayer = [];
  });

  it('does not push anything when items is empty', () => {
    trackItemList({ item_list_name: 'results_programs', items: [] });
    expect(window.dataLayer).toHaveLength(0);
  });

  it('pushes the ecommerce clear + view_item_list when items are present', () => {
    trackItemList({
      item_list_name: 'results_programs',
      items: [{ item_id: '162', item_name: 'LEAP', item_list_index: 0 }],
    });
    expect(window.dataLayer).toEqual([
      { ecommerce: null },
      {
        event: 'view_item_list',
        ecommerce: {
          item_list_name: 'results_programs',
          items: [{ item_id: '162', item_name: 'LEAP', item_list_index: 0 }],
        },
      },
    ]);
  });
});
