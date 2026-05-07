import React, { useState } from 'react';
import { X, HelpCircle, Monitor, LayoutGrid, Lock, FileText, Clock, Settings, Users, Zap, Globe, Eye } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface HelpDialogProps {
  onClose: () => void;
}

const HelpDialog: React.FC<HelpDialogProps> = ({ onClose }) => {
  const { t } = useLanguage();
  const [active, setActive] = useState('start');

  const sections = [
    { id: 'start',     icon: <Monitor size={16} />,    label: t('help_nav_start') },
    { id: 'sessions',  icon: <FileText size={16} />,   label: t('help_nav_sessions') },
    { id: 'split',     icon: <LayoutGrid size={16} />, label: t('help_nav_split') },
    { id: 'sftp',      icon: <Globe size={16} />,      label: t('help_nav_sftp') },
    { id: 'view',      icon: <Eye size={16} />,        label: t('help_nav_view') },
    { id: 'vault',     icon: <Lock size={16} />,       label: t('help_nav_vault') },
    { id: 'settings',  icon: <Settings size={16} />,   label: t('help_nav_settings') },
    { id: 'users',     icon: <Users size={16} />,      label: t('help_nav_users') },
    { id: 'logs',      icon: <Clock size={16} />,      label: t('help_nav_logs') },
    { id: 'shortcuts', icon: <Zap size={16} />,        label: t('help_nav_shortcuts') },
  ];

const box = (color: string): React.CSSProperties => ({
  backgroundColor: color + '11',
  border: `1px solid ${color}44`,
  borderLeft: `4px solid ${color}`,
  borderRadius: 6,
  padding: '12px 16px',
  marginTop: 10,
  fontSize: 13,
  lineHeight: 1.7,
});

const h3s = (color: string): React.CSSProperties => ({
  borderBottom: `2px solid ${color}`,
  paddingBottom: 8,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  color,
  marginTop: 0,
  marginBottom: 12,
});

const li: React.CSSProperties = { marginBottom: 6 };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
      <div style={{ width: 920, height: 680, backgroundColor: '#fff', borderRadius: 10, boxShadow: '0 12px 40px rgba(0,0,0,0.35)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, #005a9e, #0078d4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <HelpCircle size={22} color="#fff" />
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 17 }}>{t('help_title')}</span>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.8)', lineHeight: 1 }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* Sidebar Nav */}
          <div style={{ width: 190, borderRight: '1px solid #e8e8e8', backgroundColor: '#f7f8fa', display: 'flex', flexDirection: 'column', padding: '8px 0', overflowY: 'auto' }}>
            {sections.map(s => (
              <button
                key={s.id}
                onClick={() => setActive(s.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '9px 14px', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: 13, fontWeight: active === s.id ? 700 : 400,
                  backgroundColor: active === s.id ? '#e8f0fe' : 'transparent',
                  color: active === s.id ? '#0078d4' : '#444',
                  borderLeft: active === s.id ? '3px solid #0078d4' : '3px solid transparent',
                }}
              >
                {s.icon} {s.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', color: '#333', lineHeight: 1.7, fontSize: 14 }}>

            {active === 'start' && (
              <>
                <h3 style={h3s('#0078d4')}><Monitor size={18} /> Primeiros Passos</h3>
                <p>O <b>XTerm Web</b> é um cliente de terminal e gerenciador de arquivos que roda inteiramente no navegador. Suporta conexões <b>SSH, Telnet, SFTP e FTP</b>, com gerenciamento de sessões, múltiplos terminais simultâneos e criptografia de credenciais.</p>
                <div style={box('#0078d4')}>
                  <b>Como fazer sua primeira conexão:</b>
                  <ol style={{ paddingLeft: 20, marginTop: 8, marginBottom: 0 }}>
                    <li style={li}>Clique em <b>Session</b> ou <b>SSH</b> na barra superior para criar uma sessão salva, OU</li>
                    <li style={li}>Use a caixa <b>Quick Connect</b> no topo da barra lateral: digite <code>usuario@host:porta</code> e pressione <b>Enter</b>.</li>
                    <li style={li}>O sistema solicitará a senha e abrirá o terminal automaticamente.</li>
                  </ol>
                </div>
                <div style={box('#27ae60')}>
                  <b>Interface geral:</b>
                  <ul style={{ paddingLeft: 20, marginTop: 8, marginBottom: 0 }}>
                    <li style={li}><b>Barra superior (Ribbon):</b> Ações principais — criar sessão, escolher protocolo, visualização, configurações.</li>
                    <li style={li}><b>Barra lateral esquerda:</b> Árvore de sessões salvas, SFTP standalone, Logs e Usuários.</li>
                    <li style={li}><b>Área central:</b> Terminais ativos. Suporta múltiplos painéis simultâneos.</li>
                    <li style={li}><b>Abas superiores:</b> Cada conexão aberta aparece como uma aba clicável.</li>
                  </ul>
                </div>
              </>
            )}

            {active === 'sessions' && (
              <>
                <h3 style={h3s('#27ae60')}><FileText size={18} /> Sessões & Conexões</h3>
                <p>As sessões são configurações salvas de conexão. Você pode organizá-las em pastas, editá-las, cloná-las e conectar com um clique.</p>
                <div style={box('#27ae60')}>
                  <b>Criando uma sessão:</b>
                  <ol style={{ paddingLeft: 20, marginTop: 8, marginBottom: 0 }}>
                    <li style={li}>Clique em <b>Session</b> (ícone de monitor) ou no botão específico do protocolo: <b>SSH, SFTP, FTP, Telnet</b>.</li>
                    <li style={li}>Preencha: <b>Nome, Host, Porta, Usuário e Senha</b> (opcional com Vault ativo).</li>
                    <li style={li}>Escolha uma <b>Pasta</b> para organizar. Clique em <b>Salvar</b>.</li>
                  </ol>
                </div>
                <div style={box('#f39c12')}>
                  <b>Gerenciando sessões na barra lateral:</b>
                  <ul style={{ paddingLeft: 20, marginTop: 8, marginBottom: 0 }}>
                    <li style={li}><b>Clique simples</b> na sessão: conecta imediatamente.</li>
                    <li style={li}><b>Ícone de lápis:</b> edita a sessão.</li>
                    <li style={li}><b>Ícone de cópia:</b> clona a sessão.</li>
                    <li style={li}><b>Ícone de lixeira:</b> remove a sessão.</li>
                    <li style={li}><b>Pasta:</b> crie grupos para organizar suas conexões (ex: Produção, Testes).</li>
                    <li style={li}><b>Import/Export:</b> use os botões no topo da árvore para importar ou exportar sessões em JSON.</li>
                  </ul>
                </div>
                <div style={box('#8e44ad')}>
                  <b>Quick Connect (conexão rápida):</b><br/>
                  Digite na caixa no topo da sidebar: <code>root@192.168.1.1</code> ou <code>user@host:2222</code> e pressione Enter. O sistema abre um prompt de senha e conecta diretamente via SSH.
                </div>
              </>
            )}

            {active === 'split' && (
              <>
                <h3 style={h3s('#3498db')}><LayoutGrid size={18} /> Split & MultiExec</h3>
                <p>Trabalhe com múltiplos terminais ao mesmo tempo usando os modos de divisão de tela ou execute comandos em paralelo com o <b>MultiExec</b>.</p>
                <div style={box('#3498db')}>
                  <b>Modos de Split (botão "Split" na barra):</b>
                  <ul style={{ paddingLeft: 20, marginTop: 8, marginBottom: 0 }}>
                    <li style={li}><b>Single:</b> Um terminal por vez. Use as abas para navegar.</li>
                    <li style={li}><b>Vertical (2 painéis):</b> Divide a área central em dois terminais lado a lado.</li>
                    <li style={li}><b>Horizontal (2 painéis):</b> Dois terminais empilhados.</li>
                    <li style={li}><b>Grid (4 painéis):</b> Quatro terminais em grade 2×2.</li>
                  </ul>
                  <p style={{ marginTop: 8, marginBottom: 0, fontStyle: 'italic', color: '#555' }}>O histórico de cada terminal é preservado ao trocar de modo.</p>
                </div>
                <div style={box('#9b59b6')}>
                  <b>MultiExec (botão "MultiExec"):</b><br/>
                  Envia o mesmo comando simultaneamente para <b>todas as sessões SSH abertas</b> (até 4). Ideal para aplicar patches ou reiniciar serviços em vários servidores ao mesmo tempo.
                  <ul style={{ paddingLeft: 20, marginTop: 8, marginBottom: 0 }}>
                    <li style={li}>Requer ao menos <b>2 sessões abertas</b> para ativar.</li>
                    <li style={li}>O botão fica <b>vermelho</b> quando o modo está ativo.</li>
                    <li style={li}>Clique novamente para desativar e voltar ao modo anterior.</li>
                  </ul>
                </div>
              </>
            )}

            {active === 'sftp' && (
              <>
                <h3 style={h3s('#8e44ad')}><Globe size={18} /> SFTP & FTP</h3>
                <p>Gerencie arquivos remotos via SFTP (sobre SSH) ou FTP diretamente pelo navegador, sem precisar de software adicional.</p>
                <div style={box('#8e44ad')}>
                  <b>Painel SFTP (sessão SSH ativa):</b>
                  <ul style={{ paddingLeft: 20, marginTop: 8, marginBottom: 0 }}>
                    <li style={li}>Ao conectar via SSH com SFTP habilitado, o painel de arquivos aparece automaticamente à esquerda do terminal.</li>
                    <li style={li}><b>Duplo clique</b> em arquivo: faz download para sua máquina.</li>
                    <li style={li}><b>Drag & Drop:</b> arraste arquivos do seu computador para o painel para fazer upload.</li>
                    <li style={li}><b>Botão direito:</b> renomear, excluir, ver propriedades.</li>
                    <li style={li}>Redimensione o painel arrastando a borda divisória.</li>
                  </ul>
                </div>
                <div style={box('#f39c12')}>
                  <b>Sessão SFTP/FTP standalone:</b>
                  <ul style={{ paddingLeft: 20, marginTop: 8, marginBottom: 0 }}>
                    <li style={li}>Clique em <b>SFTP</b> ou <b>FTP</b> na barra superior para criar uma conexão de gerenciamento de arquivos sem terminal.</li>
                    <li style={li}>A sessão FTP abre o gerenciador em tela cheia na área central.</li>
                    <li style={li}>Você pode ter sessões SFTP/FTP abertas em abas separadas simultaneamente.</li>
                  </ul>
                </div>
              </>
            )}

            {active === 'view' && (
              <>
                <h3 style={h3s('#2ecc71')}><Eye size={18} /> View & Temas</h3>
                <p>Personalize a aparência e o comportamento visual da interface pelo menu <b>View</b>.</p>
                <div style={box('#2ecc71')}>
                  <b>Opções do menu View:</b>
                  <ul style={{ paddingLeft: 20, marginTop: 8, marginBottom: 0 }}>
                    <li style={li}><b>Fullscreen:</b> expande a interface para tela cheia (F11 no navegador também funciona).</li>
                    <li style={li}><b>Zoom + / Zoom –:</b> aumenta ou diminui o tamanho da fonte do terminal. O valor atual é exibido em pixels.</li>
                    <li style={li}><b>Print Screen:</b> abre o diálogo de impressão para imprimir a tela do terminal.</li>
                  </ul>
                </div>
                <div style={box('#3498db')}>
                  <b>Tema (via Settings):</b><br/>
                  Alterne entre <b>Dark</b> (escuro) e <b>Light</b> (claro) pelo menu <b>Settings → Theme</b>. A preferência é salva automaticamente para a próxima sessão.
                </div>
              </>
            )}

            {active === 'vault' && (
              <>
                <h3 style={h3s('#e74c3c')}><Lock size={18} /> Password Vault (Cofre de Senhas)</h3>
                <p>O Password Vault permite armazenar senhas de sessão de forma <b>criptografada</b>, protegidas por uma Senha Mestre que só você conhece.</p>
                <div style={box('#e74c3c')}>
                  <b>Como configurar pela primeira vez:</b>
                  <ol style={{ paddingLeft: 20, marginTop: 8, marginBottom: 0 }}>
                    <li style={li}>Acesse <b>Settings → Setup Password Vault</b>.</li>
                    <li style={li}>Defina uma <b>Senha Mestre forte</b>. Ela nunca é armazenada em texto puro.</li>
                    <li style={li}>Confirme. O cofre estará ativo para a sessão atual.</li>
                  </ol>
                </div>
                <div style={box('#f39c12')}>
                  <b>Arquitetura de Segurança:</b>
                  <ul style={{ paddingLeft: 20, marginTop: 8, marginBottom: 0 }}>
                    <li style={li}><b>Criptografia:</b> AES-256-GCM — padrão militar, garante confidencialidade e integridade.</li>
                    <li style={li}><b>Derivação de chave:</b> PBKDF2-SHA512 com 100.000 iterações — força bruta é inviável.</li>
                    <li style={li}><b>Armazenamento:</b> O servidor guarda apenas um <i>hash</i> (scrypt) para validação. A senha mestre <b>nunca</b> é salva.</li>
                    <li style={li}><b>Volatilidade:</b> A senha mestre fica apenas no <code>sessionStorage</code> e é apagada ao fechar o navegador.</li>
                  </ul>
                </div>
                <div style={box('#27ae60')}>
                  <b>Fluxo de uso diário:</b>
                  <ul style={{ paddingLeft: 20, marginTop: 8, marginBottom: 0 }}>
                    <li style={li}>Na próxima sessão, vá em <b>Settings → Unlock Password Vault</b> e insira sua Senha Mestre.</li>
                    <li style={li}>As credenciais salvas serão descriptografadas automaticamente ao conectar.</li>
                    <li style={li}>Para bloquear manualmente: <b>Settings → Lock Vault (Active)</b>.</li>
                  </ul>
                </div>
                <div style={{ ...box('#e74c3c'), marginTop: 14 }}>
                  <b>⚠️ Importante:</b> Se esquecer a Senha Mestre, não há recuperação. As senhas criptografadas serão perdidas. Guarde a Senha Mestre em local seguro.
                </div>
              </>
            )}

            {active === 'settings' && (
              <>
                <h3 style={h3s('#95a5a6')}><Settings size={18} /> Configurações</h3>
                <p>Acesse o menu <b>Settings</b> na barra superior para personalizar a ferramenta.</p>
                <div style={box('#7f8c8d')}>
                  <b>Opções disponíveis:</b>
                  <ul style={{ paddingLeft: 20, marginTop: 8, marginBottom: 0 }}>
                    <li style={li}><b>Theme:</b> alterna entre modo escuro e claro.</li>
                    <li style={li}><b>Password Vault:</b> configura ou desbloqueia o cofre de senhas.</li>
                    <li style={li}><b>Lock Vault:</b> aparece apenas quando o cofre está desbloqueado — permite bloquear imediatamente.</li>
                    <li style={li}><b>System User Manager:</b> acesso rápido à gestão de usuários da plataforma (apenas admin).</li>
                    <li style={li}><b>Default Credentials:</b> define um usuário e senha padrão para preenchimento automático ao criar novas sessões. Pode ser ativado/desativado.</li>
                    <li style={li}><b>Export Configuration:</b> exporta sessões e preferências para um arquivo <code>.json</code> de backup.</li>
                    <li style={li}><b>Import Configuration:</b> importa um arquivo de configuração exportado anteriormente.</li>
                  </ul>
                </div>
                <div style={box('#3498db')}>
                  <b>Default Credentials (Credenciais Padrão):</b><br/>
                  Quando ativadas, o usuário e senha definidos são preenchidos automaticamente no formulário de nova sessão, acelerando a criação de conexões para ambientes com credenciais compartilhadas.
                </div>
              </>
            )}

            {active === 'users' && (
              <>
                <h3 style={h3s('#8e44ad')}><Users size={18} /> Gestão de Usuários</h3>
                <p>Disponível apenas para usuários com perfil <b>admin</b>. Acesse pela barra lateral (aba <b>Users</b>) ou via <b>Settings → System User Manager</b>.</p>
                <div style={box('#8e44ad')}>
                  <b>Funcionalidades:</b>
                  <ul style={{ paddingLeft: 20, marginTop: 8, marginBottom: 0 }}>
                    <li style={li}><b>Novo Usuário:</b> clique em <b>+ New User</b> para criar um usuário com nome, senha e perfil (admin ou user).</li>
                    <li style={li}><b>Editar:</b> altere nome, senha ou perfil de qualquer usuário existente.</li>
                    <li style={li}><b>Excluir:</b> remove o usuário permanentemente. O usuário <b>admin</b> principal não pode ser excluído.</li>
                    <li style={li}><b>Perfis:</b> <code>admin</code> tem acesso total; <code>user</code> pode se conectar mas não gerenciar outros usuários.</li>
                  </ul>
                </div>
                <div style={box('#e74c3c')}>
                  <b>Segurança:</b> As senhas dos usuários são armazenadas com hash bcrypt. Nunca são salvas em texto puro no banco de dados.
                </div>
              </>
            )}

            {active === 'logs' && (
              <>
                <h3 style={h3s('#f39c12')}><Clock size={18} /> Logs & Auditoria</h3>
                <p>Toda atividade de conexão é registrada automaticamente. Acesse pela aba <b>Logs</b> na barra lateral.</p>
                <div style={box('#f39c12')}>
                  <b>O que é registrado:</b>
                  <ul style={{ paddingLeft: 20, marginTop: 8, marginBottom: 0 }}>
                    <li style={li}>Data e hora de início e término de cada sessão.</li>
                    <li style={li}>Protocolo usado (SSH, SFTP, FTP, Telnet).</li>
                    <li style={li}>Host e porta de destino.</li>
                    <li style={li}>Usuário da plataforma que realizou a conexão.</li>
                    <li style={li}>Até <b>1000 linhas</b> de histórico de comandos por sessão.</li>
                  </ul>
                </div>
                <div style={box('#16a085')}>
                  <b>Limpeza automática:</b> Logs com mais de <b>30 dias</b> são removidos automaticamente pelo sistema para conservar espaço em disco.
                </div>
                <div style={box('#3498db')}>
                  <b>Pesquisa:</b> Use os filtros de busca por host ou data para localizar sessões antigas rapidamente.
                </div>
              </>
            )}

            {active === 'shortcuts' && (
              <>
                <h3 style={h3s('#e67e22')}><Zap size={18} /> Atalhos & Dicas</h3>
                <div style={box('#e67e22')}>
                  <b>Atalhos de teclado úteis no terminal:</b>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 10 }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f5f5f5' }}>
                        <th style={{ textAlign: 'left', padding: '6px 10px', fontSize: 12, border: '1px solid #ddd' }}>Atalho</th>
                        <th style={{ textAlign: 'left', padding: '6px 10px', fontSize: 12, border: '1px solid #ddd' }}>Função</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ['Ctrl + C', 'Interrompe o processo atual'],
                        ['Ctrl + Z', 'Suspende o processo atual'],
                        ['Ctrl + L', 'Limpa o terminal (equivale a clear)'],
                        ['Ctrl + A', 'Move o cursor para o início da linha'],
                        ['Ctrl + E', 'Move o cursor para o final da linha'],
                        ['Ctrl + R', 'Busca no histórico de comandos'],
                        ['Tab', 'Autocompleta comandos e caminhos'],
                        ['↑ / ↓', 'Navega no histórico de comandos'],
                      ].map(([k, v]) => (
                        <tr key={k}>
                          <td style={{ padding: '6px 10px', fontSize: 12, border: '1px solid #ddd' }}><code>{k}</code></td>
                          <td style={{ padding: '6px 10px', fontSize: 12, border: '1px solid #ddd' }}>{v}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={box('#27ae60')}>
                  <b>Dicas rápidas:</b>
                  <ul style={{ paddingLeft: 20, marginTop: 8, marginBottom: 0 }}>
                    <li style={li}>Clique com o <b>botão direito</b> em uma aba de terminal para ver opções como fechar, clonar ou renomear.</li>
                    <li style={li}>Arraste a barra divisória entre o painel SFTP e o terminal para redimensioná-los.</li>
                    <li style={li}>O zoom do terminal é salvo por sessão e persiste entre recargas da página.</li>
                    <li style={li}>Clique fora de qualquer menu suspenso para fechá-lo automaticamente.</li>
                    <li style={li}>O botão <b>Logout</b> no canto superior direito encerra a sessão do usuário na plataforma.</li>
                    <li style={li}><b>Exit Session</b> fecha todas as conexões abertas sem deslogar da plataforma.</li>
                  </ul>
                </div>
              </>
            )}

          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '10px 20px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8f9fa' }}>
          <span style={{ fontSize: 12, color: '#999' }}>{t('help_footer')}</span>
          <button
            onClick={onClose}
            style={{ padding: '8px 28px', backgroundColor: '#0078d4', color: '#fff', border: 'none', borderRadius: 5, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
          >
            {t('help_close')}
          </button>
        </div>

      </div>
    </div>
  );
};

export default HelpDialog;
