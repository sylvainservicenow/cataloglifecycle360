import {navLayoutContext} from '@servicenow/aiux/aiux-components-nav';
import {i18n} from '@servicenow/aiux/aiux-services';
import {AppTheme} from './theme.js';

export default {
  appTheme: AppTheme,
  applicationLayout: 'aiux-nav-layout',

  setup(ctx) {
    const items = [
      {
        icon: 'home',
        title: i18n.getMessage('Home'),
        action: {type: 'navigate', path: '/overview'}
      },
      {
        icon: 'compass',
        title: i18n.getMessage('Understand'),
        action: {type: 'navigate', path: '/explore'}
      },
      {
        icon: 'plus',
        title: i18n.getMessage('Grow'),
        action: {type: 'navigate', path: '/grow'}
      },
      {
        icon: 'gear',
        title: i18n.getMessage('Improve'),
        action: {type: 'navigate', path: '/improve'}
      }
    ];

    const activeRoute = ctx.app?.routes?.find(r => r.active);
    const itemsWithActive = items.map(item => ({
      ...item,
      ...(item.action?.path === activeRoute?.route && {active: true})
    }));

    const current = navLayoutContext.get();
    navLayoutContext.set({
      ...current,
      appTitle: i18n.getMessage('CatalogLifecycle360'),
      features: {
        unifiedExperience: true
      },
      items: itemsWithActive,
      defaultLogoFull: 'servicenow',
      defaultLogoIcon: 'servicenow'
    });
  },

  teardown() {}
};
