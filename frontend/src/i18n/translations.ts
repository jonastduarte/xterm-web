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

  // ── User display ─────────────────────────────────────────────────
  user_label:        { en: 'User',    pt: 'Usuário', es: 'Usuario', zh: '用户' },
  btn_logout:        { en: 'Logout',  pt: 'Sair',    es: 'Cerrar sesión', zh: '退出登录' },

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

  // ── Login screen ─────────────────────────────────────────────────
  login_subtitle:    { en: 'SSH • SFTP • FTP Client',    pt: 'Cliente SSH • SFTP • FTP',     es: 'Cliente SSH • SFTP • FTP',      zh: 'SSH • SFTP • FTP 客户端' },
  login_username:    { en: 'Username',                   pt: 'Usuário',                       es: 'Usuario',                       zh: '用户名'     },
  login_password:    { en: 'Password',                   pt: 'Senha',                         es: 'Contraseña',                    zh: '密码'       },
  login_signin:      { en: 'Sign In',                    pt: 'Entrar',                        es: 'Iniciar Sesión',                 zh: '登录'       },
  login_signing:     { en: 'Signing in...',              pt: 'Entrando...',                   es: 'Iniciando sesión...',            zh: '登录中...'  },
  login_footer:      { en: 'XTerm Web v1.0 — Remote Connection Manager', pt: 'XTerm Web v1.0 — Gerenciador de Conexões Remotas', es: 'XTerm Web v1.0 — Gestor de Conexiones Remotas', zh: 'XTerm Web v1.0 — 远程连接管理器' },

  // ── Session Dialog ───────────────────────────────────────────────
  sd_new_session:    { en: 'New Session',      pt: 'Nova Sessão',      es: 'Nueva Sesión',      zh: '新建会话'  },
  sd_edit_session:   { en: 'Edit Session',     pt: 'Editar Sessão',    es: 'Editar Sesión',     zh: '编辑会话'  },
  sd_clone_session:  { en: 'Clone Session',    pt: 'Clonar Sessão',    es: 'Clonar Sesión',     zh: '克隆会话'  },
  sd_session_name:   { en: 'Session name',     pt: 'Nome da sessão',   es: 'Nombre de sesión',  zh: '会话名称'  },
  sd_optional:       { en: 'Optional',         pt: 'Opcional',         es: 'Opcional',          zh: '可选'      },
  sd_folder:         { en: 'Folder',           pt: 'Pasta',            es: 'Carpeta',           zh: '文件夹'    },
  sd_none:           { en: '(None)',            pt: '(Nenhuma)',        es: '(Ninguna)',          zh: '(无)'      },
  sd_remote_host:    { en: 'Remote host',      pt: 'Host remoto',      es: 'Host remoto',       zh: '远程主机'  },
  sd_username:       { en: 'Username',         pt: 'Usuário',          es: 'Usuario',           zh: '用户名'    },
  sd_port:           { en: 'Port',             pt: 'Porta',            es: 'Puerto',            zh: '端口'      },
  sd_password:       { en: 'Password',         pt: 'Senha',            es: 'Contraseña',        zh: '密码'      },
  sd_authentication: { en: 'Authentication',  pt: 'Autenticação',     es: 'Autenticación',     zh: '认证方式'  },
  sd_auth_password:  { en: 'Password',         pt: 'Senha',            es: 'Contraseña',        zh: '密码'      },
  sd_auth_key:       { en: 'Private Key (RSA/ED25519)', pt: 'Chave Privada (RSA/ED25519)', es: 'Clave Privada (RSA/ED25519)', zh: '私钥 (RSA/ED25519)' },
  sd_key_paste:      { en: 'Private Key (paste content)', pt: 'Chave Privada (cole o conteúdo)', es: 'Clave Privada (pegue el contenido)', zh: '私钥（粘贴内容）' },
  sd_key_passphrase: { en: 'Key Passphrase (if any)',     pt: 'Frase-senha da chave (se houver)', es: 'Frase de contraseña (si aplica)', zh: '密钥密码（如有）' },
  sd_key_empty:      { en: 'Leave empty if none',         pt: 'Deixe vazio se não houver',        es: 'Dejar vacío si no aplica',        zh: '无则留空'  },
  sd_sftp_enable:    { en: 'Enable SFTP browser (file panel on connect)', pt: 'Ativar painel SFTP (painel de arquivos na conexão)', es: 'Habilitar panel SFTP (al conectar)', zh: '启用SFTP文件浏览器（连接时显示）' },
  sd_enter_pass:     { en: 'Enter password...',       pt: 'Digite a senha...',       es: 'Ingrese contraseña...', zh: '请输入密码...' },
  sd_cancel:         { en: 'Cancel',                  pt: 'Cancelar',                es: 'Cancelar',             zh: '取消'          },
  sd_save_changes:   { en: 'Save Changes',            pt: 'Salvar Alterações',       es: 'Guardar Cambios',      zh: '保存更改'       },
  sd_connect_save:   { en: 'Connect & Save',          pt: 'Conectar e Salvar',       es: 'Conectar y Guardar',   zh: '连接并保存'     },
  sd_not_available:  { en: 'is not yet available in the Web Edition.', pt: 'ainda não está disponível na versão Web.', es: 'no está disponible aún en la edición Web.', zh: '在Web版中尚不可用。' },
  sd_use_instead:    { en: 'Use SSH, SFTP, FTP, or Telnet for now.', pt: 'Use SSH, SFTP, FTP ou Telnet por enquanto.', es: 'Use SSH, SFTP, FTP o Telnet por ahora.', zh: '请暂时使用 SSH、SFTP、FTP 或 Telnet。' },
  // Section titles in session dialog
  sd_ssh_settings:   { en: 'Basic SSH settings',            pt: 'Configurações SSH básicas',      es: 'Configuración SSH básica',         zh: 'SSH基本设置'    },
  sd_sftp_settings:  { en: 'SFTP Connection Settings',      pt: 'Configurações de conexão SFTP',  es: 'Configuración de conexión SFTP',   zh: 'SFTP连接设置'   },
  sd_sftp_desc:      { en: 'Standalone SFTP file browser — connects without opening a terminal shell.', pt: 'Navegador SFTP autônomo — conecta sem abrir um terminal.', es: 'Navegador SFTP — se conecta sin abrir una terminal.', zh: '独立SFTP文件浏览器——无需打开终端即可连接。' },
  sd_ftp_settings:   { en: 'FTP Connection Settings',       pt: 'Configurações de conexão FTP',   es: 'Configuración de conexión FTP',    zh: 'FTP连接设置'    },
  sd_ftp_desc:       { en: 'Standard FTP file transfer — browse, upload, and download files.', pt: 'Transferência FTP padrão — navegue, envie e baixe arquivos.', es: 'Transferencia FTP estándar — navegue, suba y descargue archivos.', zh: '标准FTP文件传输——浏览、上传和下载文件。' },
  sd_ftp_host:       { en: 'FTP Host',                      pt: 'Host FTP',                       es: 'Host FTP',                         zh: 'FTP主机'        },
  sd_telnet_settings:{ en: 'Telnet Connection Settings',    pt: 'Configurações de conexão Telnet', es: 'Configuración de conexión Telnet', zh: 'Telnet连接设置'  },
  sd_telnet_desc:    { en: 'Unencrypted terminal connection via Telnet protocol.', pt: 'Conexão de terminal não criptografada via protocolo Telnet.', es: 'Conexión de terminal sin cifrado vía protocolo Telnet.', zh: '通过Telnet协议的非加密终端连接。' },
  sd_telnet_pass:    { en: 'Enter password (if required)...', pt: 'Digite a senha (se necessário)...', es: 'Ingrese contraseña (si se requiere)...', zh: '请输入密码（如需要）...' },
  sd_serial_settings:{ en: 'Serial Connection Settings',   pt: 'Configurações de conexão Serial', es: 'Configuración de conexión Serial', zh: '串行连接设置'    },
  sd_serial_desc:    { en: 'Connect to local serial ports using Web Serial API.', pt: 'Conecte-se a portas seriais locais usando a API Web Serial.', es: 'Conéctese a puertos seriales locales usando la API Web Serial.', zh: '使用Web Serial API连接本地串行端口。' },
  sd_baud_rate:      { en: 'Baud Rate',                     pt: 'Taxa de Bauds',                  es: 'Tasa de Baudios',                  zh: '波特率'         },
  sd_serial_hint:    { en: 'Serial port selection happens when you click Connect.', pt: 'A seleção da porta serial ocorre ao clicar em Conectar.', es: 'La selección del puerto serial ocurre al hacer clic en Conectar.', zh: '点击连接时将选择串行端口。' },

  // ── SessionTree Sidebar ──────────────────────────────────────────
  st_folder:         { en: 'Folder', pt: 'Pasta', es: 'Carpeta', zh: '文件夹' },
  st_export:         { en: 'Export', pt: 'Exportar', es: 'Exportar', zh: '导出' },
  st_import:         { en: 'Import', pt: 'Importar', es: 'Importar', zh: '导入' },
  st_folder_name:    { en: 'Folder name...', pt: 'Nome da pasta...', es: 'Nombre de la carpeta...', zh: '文件夹名称...' },
  st_add:            { en: 'Add', pt: 'Adicionar', es: 'Añadir', zh: '添加' },
  st_cancel:         { en: 'Cancel', pt: 'Cancelar', es: 'Cancelar', zh: '取消' },
  st_user_sessions:  { en: 'USER SESSIONS', pt: 'SESSÕES DO USUÁRIO', es: 'SESIONES DE USUARIO', zh: '用户会话' },
  st_empty_folder:   { en: 'Empty folder', pt: 'Pasta vazia', es: 'Carpeta vacía', zh: '空文件夹' },
  st_no_sessions:    { en: 'No sessions yet', pt: 'Nenhuma sessão ainda', es: 'Aún no hay sesiones', zh: '暂无会话' },
  st_use_session_btn:{ en: 'Use the Session button to create one', pt: 'Use o botão Sessão para criar uma', es: 'Use el botón Sesión para crear una', zh: '使用“会话”按钮创建一个' },
  st_connect:        { en: 'Connect', pt: 'Conectar', es: 'Conectar', zh: '连接' },
  st_edit:           { en: 'Edit', pt: 'Editar', es: 'Editar', zh: '编辑' },
  st_clone:          { en: 'Clone', pt: 'Clonar', es: 'Clonar', zh: '克隆' },
  st_delete:         { en: 'Delete', pt: 'Excluir', es: 'Eliminar', zh: '删除' },
  st_open_all:       { en: 'Open all sessions', pt: 'Abrir todas as sessões', es: 'Abrir todas las sesiones', zh: '打开所有会话' },
  st_create_sub:     { en: 'Create subfolder', pt: 'Criar subpasta', es: 'Crear subcarpeta', zh: '创建子文件夹' },
  st_delete_folder:  { en: 'Delete folder', pt: 'Excluir pasta', es: 'Eliminar carpeta', zh: '删除文件夹' },

  // ── SessionLogs Sidebar ──────────────────────────────────────────
  sl_title:          { en: 'Session Logs', pt: 'Logs da Sessão', es: 'Registros de Sesión', zh: '会话日志' },
  sl_desc:           { en: 'Terminal sessions are automatically recorded here. Logs are kept for 30 days.', pt: 'Sessões de terminal são gravadas automaticamente aqui. Logs são mantidos por 30 dias.', es: 'Las sesiones de terminal se registran automáticamente aquí. Los registros se guardan por 30 días.', zh: '终端会话将自动记录在此。日志保留30天。' },
  sl_search:         { en: 'Search logs by name or date...', pt: 'Pesquisar logs por nome ou data...', es: 'Buscar registros por nombre o fecha...', zh: '按名称或日期搜索日志...' },
  sl_loading:        { en: 'Loading...', pt: 'Carregando...', es: 'Cargando...', zh: '加载中...' },
  sl_no_logs:        { en: 'No logs found.', pt: 'Nenhum log encontrado.', es: 'No se encontraron registros.', zh: '未找到日志。' },
  sl_download:       { en: 'Download File', pt: 'Baixar Arquivo', es: 'Descargar Archivo', zh: '下载文件' },
  sl_trunc_warn:     { en: 'This log file exceeds 1000 lines. The preview has been truncated for performance. Please download the file to view the complete log.', pt: 'Este arquivo de log excede 1000 linhas. A visualização foi truncada para desempenho. Baixe o arquivo para ver o log completo.', es: 'Este archivo de registro excede las 1000 líneas. La vista previa se ha truncado por rendimiento. Descargue el archivo para ver el registro completo.', zh: '此日志文件超过1000行。为了性能，预览已被截断。请下载文件以查看完整日志。' },

  // ── UserManagement Sidebar ───────────────────────────────────────
  um_title:          { en: 'Users', pt: 'Usuários', es: 'Usuarios', zh: '用户' },
  um_new_user:       { en: 'New User', pt: 'Novo Usuário', es: 'Nuevo Usuario', zh: '新建用户' },
  um_role:           { en: 'Role', pt: 'Função', es: 'Rol', zh: '角色' },
  um_edit_user:      { en: 'Edit User', pt: 'Editar Usuário', es: 'Editar Usuario', zh: '编辑用户' },
  um_change_pass:    { en: 'Change Password', pt: 'Mudar Senha', es: 'Cambiar Contraseña', zh: '修改密码' },
  um_username:       { en: 'Username', pt: 'Nome de Usuário', es: 'Nombre de Usuario', zh: '用户名' },
  um_password:       { en: 'Password', pt: 'Senha', es: 'Contraseña', zh: '密码' },
  um_new_pass:       { en: 'New Password', pt: 'Nova Senha', es: 'Nueva Contraseña', zh: '新密码' },
  um_role_user:      { en: 'User', pt: 'Usuário', es: 'Usuario', zh: '用户' },
  um_role_admin:     { en: 'Admin', pt: 'Administrador', es: 'Administrador', zh: '管理员' },
  um_save:           { en: 'Save', pt: 'Salvar', es: 'Guardar', zh: '保存' },

  // ── Alerts & Confirms ────────────────────────────────────────────
  alert_multiexec:   { en: 'MultiExec requires at least 2 active terminal sessions. Open more sessions first.', pt: 'O MultiExec requer pelo menos 2 sessões de terminal ativas. Abra mais sessões primeiro.', es: 'MultiExec requiere al menos 2 sesiones de terminal activas. Abra más sesiones primero.', zh: '批量执行至少需要2个活动的终端会话。请先打开更多会话。' },
  alert_del_session: { en: 'Delete session?', pt: 'Excluir sessão?', es: '¿Eliminar sesión?', zh: '删除会话？' },
  alert_del_folder:  { en: 'Delete folder? (Sessions will be moved to root)', pt: 'Excluir pasta? (As sessões serão movidas para a raiz)', es: '¿Eliminar carpeta? (Las sesiones se moverán a la raíz)', zh: '删除文件夹？(会话将被移动到根目录)' },
  alert_del_folder2: { en: 'Delete folder?', pt: 'Excluir pasta?', es: '¿Eliminar carpeta?', zh: '删除文件夹？' },
  alert_err:         { en: 'Error: ', pt: 'Erro: ', es: 'Error: ', zh: '错误：' },
  alert_err_export:  { en: 'Error exporting: ', pt: 'Erro ao exportar: ', es: 'Error al exportar: ', zh: '导出错误：' },
  alert_inv_format:  { en: 'Invalid file format: ', pt: 'Formato de arquivo inválido: ', es: 'Formato de archivo inválido: ', zh: '无效的文件格式：' },
  alert_imp_succ:    { en: 'Sessions imported successfully!', pt: 'Sessões importadas com sucesso!', es: '¡Sesiones importadas con éxito!', zh: '会话导入成功！' },
  alert_pass_succ:   { en: 'Password changed successfully. You may need to log in again.', pt: 'Senha alterada com sucesso. Talvez seja necessário fazer login novamente.', es: 'Contraseña cambiada exitosamente. Es posible que deba iniciar sesión nuevamente.', zh: '密码修改成功。您可能需要重新登录。' },
  alert_del_user:    { en: 'Are you sure you want to delete this user? This will delete all their sessions too!', pt: 'Tem certeza de que deseja excluir este usuário? Isso excluirá todas as sessões dele também!', es: '¿Estás seguro de que deseas eliminar a este usuario? ¡Esto también eliminará todas sus sesiones!', zh: '您确定要删除此用户吗？这也会删除其所有会话！' },
  alert_fail_del:    { en: 'Failed to delete: ', pt: 'Falha ao excluir: ', es: 'Fallo al eliminar: ', zh: '删除失败：' },

  // ── MainLayout extra ─────────────────────────────────────────────
  sb_sessions:       { en: 'Sessions', pt: 'Sessões', es: 'Sesiones', zh: '会话' },
  sb_sftp:           { en: 'SFTP', pt: 'SFTP', es: 'SFTP', zh: 'SFTP' },
  sb_logs:           { en: 'Logs', pt: 'Logs', es: 'Logs', zh: '日志' },
  sb_users:          { en: 'Users', pt: 'Usuários', es: 'Usuarios', zh: '用户' },
  sb_standalone:     { en: 'Standalone SFTP/FTP', pt: 'SFTP/FTP Independente', es: 'SFTP/FTP Independiente', zh: '独立 SFTP/FTP' },
  sb_standalone_desc:{ en: 'Use the Session button or ribbon to create a dedicated SFTP or FTP connection.', pt: 'Use o botão Sessão ou o menu superior para criar uma conexão SFTP/FTP dedicada.', es: 'Use el botón Sesión o el menú superior para crear una conexión SFTP o FTP dedicada.', zh: '使用会话按钮或顶部菜单创建专用的SFTP或FTP连接。' },
  sb_new_sftp:       { en: 'New SFTP Session', pt: 'Nova Sessão SFTP', es: 'Nueva Sesión SFTP', zh: '新建 SFTP 会话' },
  sb_new_ftp:        { en: 'New FTP Session', pt: 'Nova Sessão FTP', es: 'Nueva Sesión FTP', zh: '新建 FTP 会话' },
} as const;

export type TKey = keyof typeof T;
