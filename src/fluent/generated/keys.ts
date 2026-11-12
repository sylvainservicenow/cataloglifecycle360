import '@servicenow/sdk/global'

declare global {
    namespace Now {
        namespace Internal {
            interface Keys extends KeysRegistry {
                explicit: {
                    'aiux-color-swatch|catalogintelligence360': {
                        table: 'sys_aix_color_swatch'
                        id: 'af91f0eec8ad08e5760b0cf0dafd2c51'
                    }
                    'aiux-dependency|ai-readiness.js': {
                        table: 'sys_aix_dependency'
                        id: 'dec7c07655dbeffef6641882d8024609'
                        deleted: true
                    }
                    'aiux-dependency|cat-appnav.js': {
                        table: 'sys_aix_dependency'
                        id: 'c885bd45a672edc344684a4b24e9f6df'
                        deleted: false
                    }
                    'aiux-dependency|cat-inspector.js': {
                        table: 'sys_aix_dependency'
                        id: 'bdb491675139a6d86e78b4f283190aec'
                        deleted: true
                    }
                    'aiux-dependency|cat-universe.js': {
                        table: 'sys_aix_dependency'
                        id: '526237fee88f802b09b228d479cc359e'
                        deleted: true
                    }
                    'aiux-dependency|cat-workspace.js': {
                        table: 'sys_aix_dependency'
                        id: '0ed5ed94882877aa3df5d15a411c1282'
                        deleted: true
                    }
                    'aiux-dependency|catalog-data.js': {
                        table: 'sys_aix_dependency'
                        id: '2ba80afb05c4987a3edb3a3b6f1d7e77'
                    }
                    'aiux-dependency|csdm.js': {
                        table: 'sys_aix_dependency'
                        id: 'f1e54bc723cdd6e402feb6f1282c02e8'
                        deleted: true
                    }
                    'aiux-dependency|taxonomy.js': {
                        table: 'sys_aix_dependency'
                        id: '778e23fc7084123b979c83ed09bcd7da'
                        deleted: true
                    }
                    'aiux-experience-page-rel|x-snc-catalogintel-explore-page': {
                        table: 'sys_aix_experience_page_rel'
                        id: '4c82a59ce836bb5e6419b9c32851464f'
                        deleted: false
                    }
                    'aiux-experience-page-rel|x-snc-catalogintel-home-page': {
                        table: 'sys_aix_experience_page_rel'
                        id: '94af5a6457d4e8000079d2c2572dc35b'
                        deleted: true
                    }
                    'aiux-experience-page-rel|x-snc-catalogintel-incidents-page': {
                        table: 'sys_aix_experience_page_rel'
                        id: '121b18a6e34b77ce0ce6a0577ad01d45'
                        deleted: true
                    }
                    'aiux-experience-page-rel|x-snc-catalogintel-investigate-page': {
                        table: 'sys_aix_experience_page_rel'
                        id: 'ae445debcc4d010558b3f9e4041ffe32'
                        deleted: false
                    }
                    'aiux-experience-page-rel|x-snc-catalogintel-overview-page': {
                        table: 'sys_aix_experience_page_rel'
                        id: '1d00a7f1bafd33150d2df4f8d085014a'
                    }
                    'aiux-experience-prop|appHeadCss': {
                        table: 'sys_aix_experience_properties'
                        id: '436f59590d536d29f51747d364380718'
                    }
                    'aiux-experience-prop|appPlatform': {
                        table: 'sys_aix_experience_properties'
                        id: '322482023a6b7cdbe39dd43518b76ee7'
                    }
                    'aiux-experience-prop|appTailwindCss': {
                        table: 'sys_aix_experience_properties'
                        id: '7ebc1f4f2f311ce5893dfec070691a63'
                    }
                    'aiux-experience|catalogintelligence360': {
                        table: 'sys_aix_experience'
                        id: '8a346f78cf56f1607195c7776d6be814'
                    }
                    'aiux-layout-widget|lifecycle': {
                        table: 'sys_aix_widget'
                        id: 'ecfbfda00ede491dfd6d5103d67a7513'
                    }
                    'aiux-m2m-widget-dep|cat-transform|catalog-data.js': {
                        table: 'sys_aix_m2m_widget_dependency'
                        id: '8c055f33da82c8b9f9f36d10d3f88f4c'
                    }
                    'aiux-m2m-widget-dep|cat-workbench|catalog-data.js': {
                        table: 'sys_aix_m2m_widget_dependency'
                        id: '18739410c0325ac7e1a329b5854e762e'
                    }
                    'aiux-m2m-widget-dep|x-snc-catalogintel-explore-page|cat-appnav.js': {
                        table: 'sys_aix_m2m_widget_dependency'
                        id: '3828e6e8377f21430e4c73440bcd6c02'
                        deleted: false
                    }
                    'aiux-m2m-widget-dep|x-snc-catalogintel-explore-page|cat-inspector.js': {
                        table: 'sys_aix_m2m_widget_dependency'
                        id: '81273ecb7d1d91c02bf6504de3a04f4f'
                        deleted: true
                    }
                    'aiux-m2m-widget-dep|x-snc-catalogintel-explore-page|cat-universe.js': {
                        table: 'sys_aix_m2m_widget_dependency'
                        id: '633f4666bde70b9544bd181839dcf3d8'
                        deleted: true
                    }
                    'aiux-m2m-widget-dep|x-snc-catalogintel-explore-page|cat-workspace.js': {
                        table: 'sys_aix_m2m_widget_dependency'
                        id: '729a6b2c12395321f94f0a5dced4538e'
                        deleted: true
                    }
                    'aiux-m2m-widget-dep|x-snc-catalogintel-explore-page|csdm.js': {
                        table: 'sys_aix_m2m_widget_dependency'
                        id: '9f420b862642c4105de127a8bb0c43b1'
                        deleted: true
                    }
                    'aiux-m2m-widget-dep|x-snc-catalogintel-home-page|ai-readiness.js': {
                        table: 'sys_aix_m2m_widget_dependency'
                        id: 'd60bf4850db0b91e55eef6f6210759ee'
                        deleted: true
                    }
                    'aiux-m2m-widget-dep|x-snc-catalogintel-home-page|cat-universe.js': {
                        table: 'sys_aix_m2m_widget_dependency'
                        id: '1dfa16f7eda8361018c1fe1ad266d140'
                        deleted: true
                    }
                    'aiux-m2m-widget-dep|x-snc-catalogintel-home-page|csdm.js': {
                        table: 'sys_aix_m2m_widget_dependency'
                        id: 'b22362b566618c0b3a2c31e5538659c7'
                        deleted: true
                    }
                    'aiux-m2m-widget-dep|x-snc-catalogintel-investigate-page|ai-readiness.js': {
                        table: 'sys_aix_m2m_widget_dependency'
                        id: '89a9fa26652eb3afa7efb1ad979d00a6'
                        deleted: true
                    }
                    'aiux-m2m-widget-dep|x-snc-catalogintel-investigate-page|cat-appnav.js': {
                        table: 'sys_aix_m2m_widget_dependency'
                        id: '859536050636fb62e252cd5ac2bb0fec'
                        deleted: true
                    }
                    'aiux-m2m-widget-dep|x-snc-catalogintel-investigate-page|cat-inspector.js': {
                        table: 'sys_aix_m2m_widget_dependency'
                        id: '9b33deb94a9bd58be0b093d7603cd959'
                        deleted: true
                    }
                    'aiux-m2m-widget-dep|x-snc-catalogintel-investigate-page|cat-universe.js': {
                        table: 'sys_aix_m2m_widget_dependency'
                        id: 'c30ae18fa7fcdc7697fd96db830c3fda'
                        deleted: true
                    }
                    'aiux-m2m-widget-dep|x-snc-catalogintel-investigate-page|cat-workspace.js': {
                        table: 'sys_aix_m2m_widget_dependency'
                        id: '822616839cdfc419bc8da47418926353'
                        deleted: true
                    }
                    'aiux-m2m-widget-dep|x-snc-catalogintel-investigate-page|csdm.js': {
                        table: 'sys_aix_m2m_widget_dependency'
                        id: 'fe5d35cf46ab8b436403be365c60855a'
                        deleted: true
                    }
                    'aiux-m2m-widget-dep|x-snc-catalogintel-investigate-page|taxonomy.js': {
                        table: 'sys_aix_m2m_widget_dependency'
                        id: '4012bc929a09728ad54e649cb6bfd268'
                        deleted: true
                    }
                    'aiux-m2m-widget-dep|x-snc-catalogintel-overview-page|cat-appnav.js': {
                        table: 'sys_aix_m2m_widget_dependency'
                        id: '607f15a75cbd455bc5f7115a247aa7bc'
                        deleted: false
                    }
                    'aiux-m2m-widget-dep|x-snc-catalogintel-overview-page|cat-universe.js': {
                        table: 'sys_aix_m2m_widget_dependency'
                        id: '3895343b713350ca4b7fff1c5f569e2c'
                        deleted: true
                    }
                    'aiux-m2m-widget-dep|x-snc-catalogintel-overview-page|csdm.js': {
                        table: 'sys_aix_m2m_widget_dependency'
                        id: '49edee02020822ff5a76b0bf121c95d2'
                        deleted: true
                    }
                    'aiux-m2m-widget-dep|x-snc-catalogintel-overview-page|taxonomy.js': {
                        table: 'sys_aix_m2m_widget_dependency'
                        id: 'bba5040c3793e3c97a9ab145cb2a4b6c'
                        deleted: true
                    }
                    'aiux-page-widget|x-snc-catalogintel-explore-page': {
                        table: 'sys_aix_widget'
                        id: '4c0a28d642d9f08197f01d5c4789a1fe'
                        deleted: false
                    }
                    'aiux-page-widget|x-snc-catalogintel-home-page': {
                        table: 'sys_aix_widget'
                        id: '762b95835631fd8367e6ae3ffe9065c5'
                        deleted: true
                    }
                    'aiux-page-widget|x-snc-catalogintel-incidents-page': {
                        table: 'sys_aix_widget'
                        id: 'e1ba5d6e7cc804bf9b2f7a62eea45cd1'
                        deleted: true
                    }
                    'aiux-page-widget|x-snc-catalogintel-investigate-page': {
                        table: 'sys_aix_widget'
                        id: '8a85393c12174648123b158bee7bc14c'
                        deleted: false
                    }
                    'aiux-page-widget|x-snc-catalogintel-overview-page': {
                        table: 'sys_aix_widget'
                        id: '27c60361522adcddf630837fdf1c3b46'
                    }
                    'aiux-page|x-snc-catalogintel-explore-page': {
                        table: 'sys_aix_page'
                        id: '75c6e1db5bed7bf2be3e0e5de6d03a69'
                        deleted: false
                    }
                    'aiux-page|x-snc-catalogintel-home-page': {
                        table: 'sys_aix_page'
                        id: '9f9d271877e1afa9cecacc45a84f47af'
                        deleted: true
                    }
                    'aiux-page|x-snc-catalogintel-incidents-page': {
                        table: 'sys_aix_page'
                        id: 'b424d5e8bd9e23cbca2cf666c2f24c68'
                        deleted: true
                    }
                    'aiux-page|x-snc-catalogintel-investigate-page': {
                        table: 'sys_aix_page'
                        id: '27cefce42134cdb9adda35c2e3f0bc6d'
                        deleted: false
                    }
                    'aiux-page|x-snc-catalogintel-overview-page': {
                        table: 'sys_aix_page'
                        id: 'd10523867cff17c2bd9ef99aa3b44858'
                    }
                    'aiux-project|x_snc_catalogintel_catalogintelligence360': {
                        table: 'sys_aix_project'
                        id: 'b74fcd1be6c74390c8d6e84fdab17ee4'
                    }
                    'aiux-theme|catalogintelligence360': {
                        table: 'sys_aix_theme'
                        id: '4b62b3d288da72d30a480b17b4747071'
                    }
                    'aiux-widget|aiux-hello-world': {
                        table: 'sys_aix_widget'
                        id: '59be3863232c5f22bb3f799cdfc65a21'
                        deleted: true
                    }
                    'aiux-widget|cat-semantic-assess': {
                        table: 'sys_aix_widget'
                        id: '4317ecac5de39dea97460f71d867d582'
                    }
                    'aiux-widget|cat-transform': {
                        table: 'sys_aix_widget'
                        id: '5445fa2af9a64bcb87e5e7633c5a124b'
                    }
                    'aiux-widget|cat-workbench': {
                        table: 'sys_aix_widget'
                        id: 'bb38ab177a41bdaa1c01352ae669b079'
                    }
                    bom_json: {
                        table: 'sys_module'
                        id: 'a6ecdb490f144780868d34ace29c05f0'
                    }
                    package_json: {
                        table: 'sys_module'
                        id: '1439a868494347f6a7fe6daf36059d48'
                    }
                    'sys-analytics-app|catalogintelligence360': {
                        table: 'sys_analytics_app'
                        id: '0ab3129be3af0dd289d62464fce81284'
                    }
                }
                composite: [
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: 'cf399f596e284ba8bb697145475b39bd'
                        key: {
                            application_file: 'b74fcd1be6c74390c8d6e84fdab17ee4'
                            source_artifact: 'f78e0239cec14975afc6e210510fd45f'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact'
                        id: 'f78e0239cec14975afc6e210510fd45f'
                        key: {
                            name: 'aiux-source b74fcd1be6c74390c8d6e84fdab17ee4'
                        }
                    },
                ]
            }
        }
    }
}
