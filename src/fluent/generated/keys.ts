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
                    'aiux-dependency|cat-universe.js': {
                        table: 'sys_aix_dependency'
                        id: '526237fee88f802b09b228d479cc359e'
                    }
                    'aiux-experience-page-rel|x-snc-catalogintel-explore-page': {
                        table: 'sys_aix_experience_page_rel'
                        id: '4c82a59ce836bb5e6419b9c32851464f'
                    }
                    'aiux-experience-page-rel|x-snc-catalogintel-home-page': {
                        table: 'sys_aix_experience_page_rel'
                        id: '94af5a6457d4e8000079d2c2572dc35b'
                    }
                    'aiux-experience-page-rel|x-snc-catalogintel-incidents-page': {
                        table: 'sys_aix_experience_page_rel'
                        id: '121b18a6e34b77ce0ce6a0577ad01d45'
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
                    'aiux-m2m-widget-dep|x-snc-catalogintel-explore-page|cat-universe.js': {
                        table: 'sys_aix_m2m_widget_dependency'
                        id: '633f4666bde70b9544bd181839dcf3d8'
                    }
                    'aiux-m2m-widget-dep|x-snc-catalogintel-home-page|cat-universe.js': {
                        table: 'sys_aix_m2m_widget_dependency'
                        id: '1dfa16f7eda8361018c1fe1ad266d140'
                    }
                    'aiux-page-widget|x-snc-catalogintel-explore-page': {
                        table: 'sys_aix_widget'
                        id: '4c0a28d642d9f08197f01d5c4789a1fe'
                    }
                    'aiux-page-widget|x-snc-catalogintel-home-page': {
                        table: 'sys_aix_widget'
                        id: '762b95835631fd8367e6ae3ffe9065c5'
                    }
                    'aiux-page-widget|x-snc-catalogintel-incidents-page': {
                        table: 'sys_aix_widget'
                        id: 'e1ba5d6e7cc804bf9b2f7a62eea45cd1'
                    }
                    'aiux-page|x-snc-catalogintel-explore-page': {
                        table: 'sys_aix_page'
                        id: '75c6e1db5bed7bf2be3e0e5de6d03a69'
                    }
                    'aiux-page|x-snc-catalogintel-home-page': {
                        table: 'sys_aix_page'
                        id: '9f9d271877e1afa9cecacc45a84f47af'
                    }
                    'aiux-page|x-snc-catalogintel-incidents-page': {
                        table: 'sys_aix_page'
                        id: 'b424d5e8bd9e23cbca2cf666c2f24c68'
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
