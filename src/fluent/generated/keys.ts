import '@servicenow/sdk/global'

declare global {
    namespace Now {
        namespace Internal {
            interface Keys extends KeysRegistry {
                explicit: {
                    'aiux-color-swatch|cataloglifecycle360': {
                        table: 'sys_aix_color_swatch'
                        id: '5b9da386b20f2f9d5b74dd11f3484407'
                    }
                    'aiux-dependency|cat-appnav.js': {
                        table: 'sys_aix_dependency'
                        id: 'ea33604cb69719ab9ba6cf7ce45b256e'
                    }
                    'aiux-dependency|cat-universe.js': {
                        table: 'sys_aix_dependency'
                        id: '114cabdbf2855561e4f4d408ce6de885'
                    }
                    'aiux-dependency|catalog-data.js': {
                        table: 'sys_aix_dependency'
                        id: 'dbcaf7a5e92d4f5410639c277298c714'
                    }
                    'aiux-dependency|icons.js': {
                        table: 'sys_aix_dependency'
                        id: 'c40983786024185c482345e7eea0e3f7'
                    }
                    'aiux-dependency|pillars.js': {
                        table: 'sys_aix_dependency'
                        id: 'e1f79b0b2640ba51e3be19dc836dfaa8'
                    }
                    'aiux-dependency|taxonomy.js': {
                        table: 'sys_aix_dependency'
                        id: '28a455d2095bd63b17a6b8a6b09ab3ba'
                    }
                    'aiux-experience-page-rel|x-snc-catlife360-explore-page': {
                        table: 'sys_aix_experience_page_rel'
                        id: '73e695d6c19dfcb53d354c1b1580816e'
                    }
                    'aiux-experience-page-rel|x-snc-catlife360-grow-page': {
                        table: 'sys_aix_experience_page_rel'
                        id: 'e95468fc0a76e17233ac890a8826b39d'
                    }
                    'aiux-experience-page-rel|x-snc-catlife360-improve-page': {
                        table: 'sys_aix_experience_page_rel'
                        id: '9d50f60d5f71309a1be110d23e65d08b'
                    }
                    'aiux-experience-page-rel|x-snc-catlife360-investigate-page': {
                        table: 'sys_aix_experience_page_rel'
                        id: '4a39e248a1b5030b0d81f92cb3318ca3'
                    }
                    'aiux-experience-page-rel|x-snc-catlife360-overview-page': {
                        table: 'sys_aix_experience_page_rel'
                        id: 'fcc4cc30c540df7fc58205250bec8f3f'
                    }
                    'aiux-experience-prop|appHeadCss': {
                        table: 'sys_aix_experience_properties'
                        id: 'e7a5a75f583b91abb081d6193fa2f7b3'
                    }
                    'aiux-experience-prop|appPlatform': {
                        table: 'sys_aix_experience_properties'
                        id: 'd413da64b3d3ede22ee1a4449efdbf57'
                    }
                    'aiux-experience-prop|appTailwindCss': {
                        table: 'sys_aix_experience_properties'
                        id: '6aadea74d382541c330340354edab3d9'
                    }
                    'aiux-experience|cataloglifecycle360': {
                        table: 'sys_aix_experience'
                        id: '676fb3cd79906e41abed7553f1ecab20'
                    }
                    'aiux-layout-widget|lifecycle': {
                        table: 'sys_aix_widget'
                        id: '638bb6de23447e98f15fbac950baf8f7'
                    }
                    'aiux-m2m-widget-dep|cat-transform|catalog-data.js': {
                        table: 'sys_aix_m2m_widget_dependency'
                        id: '54349e7c2cbbef656904323cd8a59b52'
                    }
                    'aiux-m2m-widget-dep|cat-workbench|catalog-data.js': {
                        table: 'sys_aix_m2m_widget_dependency'
                        id: '9b2a6e01f2f396519cb87d27d53d0ff2'
                    }
                    'aiux-m2m-widget-dep|x-snc-catlife360-explore-page|cat-appnav.js': {
                        table: 'sys_aix_m2m_widget_dependency'
                        id: '383a7b1b0b9c3446b01e65e95fbc3831'
                    }
                    'aiux-m2m-widget-dep|x-snc-catlife360-explore-page|cat-universe.js': {
                        table: 'sys_aix_m2m_widget_dependency'
                        id: '306f57ecc421555f95bdb524bad240c0'
                    }
                    'aiux-m2m-widget-dep|x-snc-catlife360-explore-page|icons.js': {
                        table: 'sys_aix_m2m_widget_dependency'
                        id: '961f90cfd918384ac88ecb1eb452c2eb'
                    }
                    'aiux-m2m-widget-dep|x-snc-catlife360-explore-page|taxonomy.js': {
                        table: 'sys_aix_m2m_widget_dependency'
                        id: '47ac553bc34529c60866520433822ae0'
                    }
                    'aiux-m2m-widget-dep|x-snc-catlife360-grow-page|cat-appnav.js': {
                        table: 'sys_aix_m2m_widget_dependency'
                        id: '0a20170e430bbcb6afeef06a03bea6cf'
                    }
                    'aiux-m2m-widget-dep|x-snc-catlife360-improve-page|cat-appnav.js': {
                        table: 'sys_aix_m2m_widget_dependency'
                        id: '72162ddc250e7ee851d8cd1dbcc5b600'
                    }
                    'aiux-m2m-widget-dep|x-snc-catlife360-improve-page|icons.js': {
                        table: 'sys_aix_m2m_widget_dependency'
                        id: 'c20dfadf0eab0935f17fffced8362826'
                    }
                    'aiux-m2m-widget-dep|x-snc-catlife360-improve-page|pillars.js': {
                        table: 'sys_aix_m2m_widget_dependency'
                        id: 'd03706fd085672cfd3f8f7fc40ff1889'
                    }
                    'aiux-m2m-widget-dep|x-snc-catlife360-improve-page|taxonomy.js': {
                        table: 'sys_aix_m2m_widget_dependency'
                        id: 'c5da4a669ef3b22184b21d2a32d6b788'
                    }
                    'aiux-m2m-widget-dep|x-snc-catlife360-overview-page|cat-appnav.js': {
                        table: 'sys_aix_m2m_widget_dependency'
                        id: '84d9c8e870654179be65375f2c4997d3'
                    }
                    'aiux-m2m-widget-dep|x-snc-catlife360-overview-page|cat-universe.js': {
                        table: 'sys_aix_m2m_widget_dependency'
                        id: 'fbb8f5b27787b887de6b8e7c2357eef8'
                    }
                    'aiux-m2m-widget-dep|x-snc-catlife360-overview-page|pillars.js': {
                        table: 'sys_aix_m2m_widget_dependency'
                        id: '3bdc30876bccfc2d23a09195e8272a6a'
                    }
                    'aiux-m2m-widget-dep|x-snc-catlife360-overview-page|taxonomy.js': {
                        table: 'sys_aix_m2m_widget_dependency'
                        id: '3685c43fd57e0126a44e1ec3fcdb4b78'
                    }
                    'aiux-page-widget|x-snc-catlife360-explore-page': {
                        table: 'sys_aix_widget'
                        id: '2eca7e1f3a6cc0252987c0af9677d69b'
                    }
                    'aiux-page-widget|x-snc-catlife360-grow-page': {
                        table: 'sys_aix_widget'
                        id: '282ba27f0e3898d7ad6fd4837aa5c5d6'
                    }
                    'aiux-page-widget|x-snc-catlife360-improve-page': {
                        table: 'sys_aix_widget'
                        id: '06f7ab7040704fc6daa32c19c9e51aef'
                    }
                    'aiux-page-widget|x-snc-catlife360-investigate-page': {
                        table: 'sys_aix_widget'
                        id: '689541125fa27e5d1a05b2b2b84258b5'
                    }
                    'aiux-page-widget|x-snc-catlife360-overview-page': {
                        table: 'sys_aix_widget'
                        id: 'c70e49d7d9e5e2b78146214b034f7cac'
                    }
                    'aiux-page|x-snc-catlife360-explore-page': {
                        table: 'sys_aix_page'
                        id: 'c587e7466a029a18e55dad60543c6dff'
                    }
                    'aiux-page|x-snc-catlife360-grow-page': {
                        table: 'sys_aix_page'
                        id: '344ae1bfedb6bc5780d253924f9cad37'
                    }
                    'aiux-page|x-snc-catlife360-improve-page': {
                        table: 'sys_aix_page'
                        id: 'd4d311651bdb17e2162f322c37e211eb'
                    }
                    'aiux-page|x-snc-catlife360-investigate-page': {
                        table: 'sys_aix_page'
                        id: '592309589c454ccfb5c7efebf4204a25'
                    }
                    'aiux-page|x-snc-catlife360-overview-page': {
                        table: 'sys_aix_page'
                        id: 'e9df076f844a7ee82a94d9695e3c72c9'
                    }
                    'aiux-project|x_snc_catlife360_cataloglifecycle360': {
                        table: 'sys_aix_project'
                        id: '5ea0b8d8d3844e2bb71a2e1d985ee619'
                    }
                    'aiux-theme|cataloglifecycle360': {
                        table: 'sys_aix_theme'
                        id: 'cba35e713b42fc9a356bfde20a488945'
                    }
                    'aiux-widget|cat-semantic-assess': {
                        table: 'sys_aix_widget'
                        id: 'b0f0fd8d00b1115d51ba4bc8c130b67e'
                    }
                    'aiux-widget|cat-transform': {
                        table: 'sys_aix_widget'
                        id: 'c69230d07ff0835886602480d939e15a'
                    }
                    'aiux-widget|cat-workbench': {
                        table: 'sys_aix_widget'
                        id: '9f9b64031f04f3ef76bced9c8adec1df'
                    }
                    bom_json: {
                        table: 'sys_module'
                        id: '70fdec1814654c05a8894446ab5a36b3'
                    }
                    package_json: {
                        table: 'sys_module'
                        id: '33affed94b384eb6a1481a87eca56b7a'
                    }
                    'sys-analytics-app|cataloglifecycle360': {
                        table: 'sys_analytics_app'
                        id: '9f533e0edf3b8ca98ac479b037e8cef8'
                    }
                }
                composite: [
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: '67ad869e894047f5b835d618e1d34b35'
                        key: {
                            application_file: '5ea0b8d8d3844e2bb71a2e1d985ee619'
                            source_artifact: 'b0c3083f90f349279e839cac0bdde221'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact'
                        id: 'b0c3083f90f349279e839cac0bdde221'
                        key: {
                            name: 'aiux-source 5ea0b8d8d3844e2bb71a2e1d985ee619'
                        }
                    },
                ]
            }
        }
    }
}
