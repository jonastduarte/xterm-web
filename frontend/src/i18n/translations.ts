export type Lang = 'en' | 'pt' | 'es' | 'zh';

export const LANGUAGES: { code: Lang; label: string; flag: string }[] = [
  { code: 'en', label: 'English',    flag: '🇺🇸' },
  { code: 'pt', label: 'Português',  flag: '🇧🇷' },
  { code: 'es', label: 'Español',    flag: '🇪🇸' },
  { code: 'zh', label: '中文',        flag: '🇨🇳' },
];

export const T = {
  // ── Ribbon buttons ──────────────────────────────────────────────
  ribbon_session:    { en: 'Session',      pt: 'Sessão',      es: 'Sesión',     zh: '会话'   },
  ribbon_ssh:        { en: 'SSH',           pt: 'SSH',         es: 'SSH',        zh: 'SSH'   },
  ribbon_sftp:       { en: 'SFTP',          pt: 'SFTP',        es: 'SFTP',       zh: 'SFTP'  },
  ribbon_ftp:        { en: 'FTP',           pt: 'FTP',         es: 'FTP',        zh: 'FTP'   },
  ribbon_telnet:     { en: 'Telnet',        pt: 'Telnet',      es: 'Telnet',     zh: 'Telnet'},
  ribbon_view:       { en: 'View',          pt: 'Exibir',      es: 'Vista',      zh: '视图'   },
  ribbon_split:      { en: 'Split',         pt: 'Dividir',     es: 'Dividir',    zh: '分屏'   },
  ribbon_multiexec:  { en: 'MultiExec',     pt: 'MultiExec',   es: 'MultiExec',  zh: '批量执行'},
  ribbon_settings:   { en: 'Settings',      pt: 'Config.',     es: 'Config.',    zh: '设置'   },
  ribbon_help:       { en: 'Help',          pt: 'Ajuda',       es: 'Ayuda',      zh: '帮助'   },
  ribbon_exit:       { en: 'Exit Session',  pt: 'Sair',        es: 'Salir',      zh: '退出会话'},

  // ── View menu ───────────────────────────────────────────────────
  view_fullscreen:   { en: 'Fullscreen',         pt: 'Tela Cheia',       es: 'Pantalla Completa', zh: '全屏'     },
  view_zoomin:       { en: 'Zoom +',             pt: 'Zoom +',           es: 'Zoom +',            zh: '放大字体'  },
  view_zoomout:      { en: 'Zoom –',             pt: 'Zoom –',           es: 'Zoom –',            zh: '缩小字体'  },
  view_print:        { en: 'Print Screen',       pt: 'Imprimir Tela',    es: 'Imprimir Pantalla', zh: '打印屏幕'  },

  // ── Split menu ──────────────────────────────────────────────────
  split_single:      { en: 'Single terminal',            pt: 'Terminal único',           es: 'Terminal único',         zh: '单终端'    },
  split_vertical:    { en: '2 terminals (vertical)',     pt: '2 terminais (vertical)',   es: '2 terminales (vertical)',zh: '双屏(垂直)' },
  split_horizontal:  { en: '2 terminals (horizontal)',   pt: '2 terminais (horizontal)', es: '2 terminales (horizontal)',zh:'双屏(水平)' },
  split_grid:        { en: '4 terminals (grid)',         pt: '4 terminais (grade)',      es: '4 terminales (cuadrícula)',zh:'四宫格'    },

  // ── Settings menu ───────────────────────────────────────────────
  settings_theme:        { en: 'Theme',                     pt: 'Tema',                       es: 'Tema',                      zh: '主题'      },
  settings_theme_dark:   { en: 'Dark',                      pt: 'Escuro',                     es: 'Oscuro',                    zh: '深色'      },
  settings_theme_light:  { en: 'Light',                     pt: 'Claro',                      es: 'Claro',                     zh: '浅色'      },
  settings_theme_toggle: { en: '(toggle)',                  pt: '(alternar)',                  es: '(alternar)',                zh: '(切换)'    },
  settings_vault_unlock: { en: 'Unlock Password Vault',     pt: 'Desbloquear Cofre',          es: 'Desbloquear Bóveda',        zh: '解锁密码库' },
  settings_vault_setup:  { en: 'Setup Password Vault',      pt: 'Configurar Cofre',           es: 'Configurar Bóveda',         zh: '设置密码库' },
  settings_vault_lock:   { en: 'Lock Vault (Active)',       pt: 'Bloquear Cofre (Ativo)',     es: 'Bloquear Bóveda (Activo)',  zh: '锁定密码库(已激活)'},
  settings_users:        { en: 'System User Manager',      pt: 'Gerenciar Usuários',         es: 'Gestión de Usuarios',       zh: '用户管理'   },
  settings_creds:        { en: 'Default Credentials',      pt: 'Credenciais Padrão',         es: 'Credenciales por Defecto',  zh: '默认凭据'   },
  settings_creds_active: { en: '(Active)',                  pt: '(Ativo)',                    es: '(Activo)',                  zh: '(已启用)'  },
  settings_creds_disabled:{ en: '(Disabled)',               pt: '(Desativado)',               es: '(Desactivado)',             zh: '(已禁用)'  },
  settings_export:       { en: 'Export Configuration',     pt: 'Exportar Configuração',      es: 'Exportar Configuración',    zh: '导出配置'   },
  settings_import:       { en: 'Import Configuration',     pt: 'Importar Configuração',      es: 'Importar Configuración',    zh: '导入配置'   },
  settings_language:     { en: 'Language',                 pt: 'Idioma',                     es: 'Idioma',                    zh: '语言'      },

  // ── Sidebar ─────────────────────────────────────────────────────
  sidebar_quick_connect: { en: 'Quick connect...',         pt: 'Conexão rápida...',          es: 'Conexión rápida...',        zh: '快速连接...' },
  sidebar_sftp_title:    { en: 'Standalone SFTP/FTP',      pt: 'SFTP/FTP Standalone',        es: 'SFTP/FTP Independiente',    zh: '独立SFTP/FTP'},
  sidebar_sftp_hint:     { en: 'Use the Session button or ribbon to create a dedicated SFTP or FTP connection.',
                           pt: 'Use o botão Sessão ou a barra para criar uma conexão SFTP ou FTP.',
                           es: 'Use el botón Sesión o la barra para crear una conexión SFTP o FTP.',
                           zh: '请使用会话按钮或工具栏创建专用SFTP或FTP连接。' },
  sidebar_sftp_new:      { en: 'New SFTP Session',         pt: 'Nova Sessão SFTP',           es: 'Nueva Sesión SFTP',         zh: '新建SFTP会话'},
  sidebar_ftp_new:       { en: 'New FTP Session',          pt: 'Nova Sessão FTP',            es: 'Nueva Sesión FTP',          zh: '新建FTP会话' },
  sidebar_logs_title:    { en: 'Session Logs',             pt: 'Logs de Sessão',             es: 'Registros de Sesión',       zh: '会话日志'   },
  sidebar_users_title:   { en: 'Users',                    pt: 'Usuários',                   es: 'Usuarios',                  zh: '用户'       },

  // ── Tab context menu ─────────────────────────────────────────────
  tab_close:         { en: 'Close Tab',        pt: 'Fechar Aba',       es: 'Cerrar Pestaña',  zh: '关闭标签'  },
  tab_close_all:     { en: 'Close All Tabs',   pt: 'Fechar Todas',     es: 'Cerrar Todo',     zh: '关闭全部'  },
  tab_duplicate:     { en: 'Duplicate',         pt: 'Duplicar',        es: 'Duplicar',        zh: '复制'      },

  // ── Vault modal ──────────────────────────────────────────────────
  vault_title_setup:   { en: 'Setup Password Vault',  pt: 'Configurar Cofre',       es: 'Configurar Bóveda',   zh: '设置密码库'  },
  vault_title_unlock:  { en: 'Unlock Password Vault', pt: 'Desbloquear Cofre',      es: 'Desbloquear Bóveda',  zh: '解锁密码库'  },
  vault_desc_setup:    { en: 'Create a master password to encrypt your session credentials.',
                         pt: 'Crie uma senha mestre para criptografar suas credenciais de sessão.',
                         es: 'Cree una contraseña maestra para cifrar sus credenciales.',
                         zh: '创建主密码以加密您的会话凭据。' },
  vault_desc_unlock:   { en: 'Enter your master password to decrypt session credentials.',
                         pt: 'Insira a senha mestre para descriptografar as credenciais.',
                         es: 'Ingrese su contraseña maestra para descifrar las credenciales.',
                         zh: '输入主密码以解密会话凭据。' },
  vault_placeholder:   { en: 'Master Password...',    pt: 'Senha Mestre...',        es: 'Contraseña Maestra...', zh: '主密码...'  },
  vault_cancel:        { en: 'Cancel',                pt: 'Cancelar',               es: 'Cancelar',             zh: '取消'       },
  vault_btn_setup:     { en: 'Setup Vault',           pt: 'Configurar Cofre',       es: 'Configurar Bóveda',    zh: '设置密码库'  },
  vault_btn_unlock:    { en: 'Unlock',                pt: 'Desbloquear',            es: 'Desbloquear',          zh: '解锁'       },

  // ── User display ─────────────────────────────────────────────────
  user_label:        { en: 'User',    pt: 'Usuário', es: 'Usuario', zh: '用户' },
  btn_logout:        { en: 'Logout',  pt: 'Sair',    es: 'Cerrar sesión', zh: '退出登录' },

  // ── Empty pane ───────────────────────────────────────────────────
  pane_empty:        { en: 'Empty Pane',       pt: 'Painel Vazio',   es: 'Panel Vacío',    zh: '空面板'    },
  pane_closed:       { en: 'Connection closed',pt: 'Conexão fechada',es: 'Conexión cerrada',zh: '连接已关闭'},
  pane_sftp_session: { en: 'SFTP Session',     pt: 'Sessão SFTP',    es: 'Sesión SFTP',    zh: 'SFTP会话'  },

  // ── Welcome screen ───────────────────────────────────────────────
  welcome_title:     { en: 'XTerm Web',                   pt: 'XTerm Web',                   es: 'XTerm Web',                   zh: 'XTerm Web'   },
  welcome_sub:       { en: 'SSH client, SFTP browser, and FTP client — all in your browser.',
                       pt: 'Cliente SSH, navegador SFTP e cliente FTP — tudo no seu navegador.',
                       es: 'Cliente SSH, navegador SFTP y cliente FTP — todo en su navegador.',
                       zh: 'SSH客户端、SFTP浏览器和FTP客户端——全在您的浏览器中。' },
  welcome_hint:      { en: 'Create a session or use Quick Connect to get started.',
                       pt: 'Crie uma sessão ou use Conexão Rápida para começar.',
                       es: 'Cree una sesión o use Conexión Rápida para comenzar.',
                       zh: '创建会话或使用快速连接开始使用。' },
  welcome_btn:       { en: '+ New Session',    pt: '+ Nova Sessão',   es: '+ Nueva Sesión',  zh: '+ 新建会话' },

  // ── MultiExec bar ────────────────────────────────────────────────
  multiexec_active:  { en: '⚡ MultiExec Active — Commands sent to all open terminals simultaneously.',
                       pt: '⚡ MultiExec Ativo — Comandos enviados para todos os terminais abertos simultaneamente.',
                       es: '⚡ MultiExec Activo — Comandos enviados a todos los terminales simultáneamente.',
                       zh: '⚡ MultiExec已激活 — 命令将同时发送到所有打开的终端。' },
  multiexec_exit:    { en: 'Exit MultiExec', pt: 'Sair do MultiExec', es: 'Salir de MultiExec', zh: '退出批量执行' },

  // ── Default creds modal ──────────────────────────────────────────
  creds_title:       { en: 'Default Credentials',    pt: 'Credenciais Padrão',        es: 'Credenciales por Defecto',  zh: '默认凭据'   },
  creds_enable:      { en: 'Enable default credentials', pt: 'Ativar credenciais padrão', es: 'Habilitar credenciales',  zh: '启用默认凭据'},
  creds_user:        { en: 'Default Username',        pt: 'Usuário Padrão',            es: 'Usuario por Defecto',       zh: '默认用户名'  },
  creds_pass:        { en: 'Default Password',        pt: 'Senha Padrão',              es: 'Contraseña por Defecto',    zh: '默认密码'   },
  creds_save:        { en: 'Save',                    pt: 'Salvar',                    es: 'Guardar',                   zh: '保存'       },
  creds_cancel:      { en: 'Cancel',                  pt: 'Cancelar',                  es: 'Cancelar',                  zh: '取消'       },

  // ── Help dialog nav ──────────────────────────────────────────────
  help_title:        { en: 'XTerm Web — Complete User Guide', pt: 'XTerm Web — Guia Completo do Usuário', es: 'XTerm Web — Guía Completa del Usuario', zh: 'XTerm Web — 完整用户指南' },
  help_close:        { en: 'Close',   pt: 'Fechar',  es: 'Cerrar',  zh: '关闭' },
  help_footer:       { en: 'XTerm Web — Internal documentation v2.0', pt: 'XTerm Web — Documentação interna v2.0', es: 'XTerm Web — Documentación interna v2.0', zh: 'XTerm Web — 内部文档 v2.0' },

  help_nav_start:     { en: 'Getting Started',    pt: 'Primeiros Passos',     es: 'Primeros Pasos',    zh: '快速入门'  },
  help_nav_sessions:  { en: 'Sessions',            pt: 'Sessões',              es: 'Sesiones',          zh: '会话管理'  },
  help_nav_split:     { en: 'Split & MultiExec',  pt: 'Split & MultiExec',   es: 'Split & MultiExec', zh: '分屏与批量'},
  help_nav_sftp:      { en: 'SFTP & FTP',         pt: 'SFTP & FTP',          es: 'SFTP & FTP',        zh: 'SFTP与FTP'},
  help_nav_view:      { en: 'View & Themes',      pt: 'Exibição & Temas',    es: 'Vista & Temas',     zh: '视图与主题'},
  help_nav_vault:     { en: 'Password Vault',     pt: 'Cofre de Senhas',     es: 'Bóveda de Contraseñas', zh: '密码库' },
  help_nav_settings:  { en: 'Settings',           pt: 'Configurações',       es: 'Configuración',     zh: '系统设置'  },
  help_nav_users:     { en: 'User Management',    pt: 'Gestão de Usuários',  es: 'Gestión de Usuarios',zh: '用户管理'  },
  help_nav_logs:      { en: 'Logs & Auditing',    pt: 'Logs & Auditoria',    es: 'Logs y Auditoría',  zh: '日志与审计'},
  help_nav_shortcuts: { en: 'Shortcuts & Tips',   pt: 'Atalhos & Dicas',     es: 'Atajos y Consejos', zh: '快捷键与技巧'},
} as const;

export type TKey = keyof typeof T;
