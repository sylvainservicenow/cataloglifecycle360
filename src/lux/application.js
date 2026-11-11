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
        title: i18n.getMessage('Explore'),
        action: {type: 'navigate', path: '/explore'}
      },
      {
        icon: 'search',
        title: i18n.getMessage('Investigate'),
        action: {type: 'navigate', path: '/investigate'}
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
      appTitle: i18n.getMessage('CatalogIntelligence360'),
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
