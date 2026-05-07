import React from 'react';
import { X, HelpCircle, Monitor, LayoutGrid, Lock, FileText, Server, Clock } from 'lucide-react';

interface HelpDialogProps {
  onClose: () => void;
}

const HelpDialog: React.FC<HelpDialogProps> = ({ onClose }) => {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
      <div style={{ width: '800px', height: '600px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 8px 30px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8f9fa' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <HelpCircle size={24} color="#005a9e" />
            <h2 style={{ margin: 0, fontSize: '18px', color: '#333' }}>XTerm Web - User Guide & Help</h2>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#999' }}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '30px', color: '#444', lineHeight: '1.6' }}>
          
          <section style={{ marginBottom: '32px' }}>
            <h3 style={{ borderBottom: '2px solid #005a9e', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', color: '#005a9e' }}>
              <Monitor size={20} /> Getting Started
            </h3>
            <p>XTerm Web is a powerful terminal emulator and file browser that runs entirely in your browser. You can connect to remote servers via SSH, Telnet, or manage files via SFTP and FTP.</p>
            <div style={{ backgroundColor: '#f0f4f8', padding: '15px', borderRadius: '6px', marginTop: '10px' }}>
              <ul style={{ paddingLeft: '20px', margin: 0 }}>
                <li><b>New Session:</b> Click the "Session" button in the top ribbon to create a saved connection.</li>
                <li><b>Quick Connect:</b> Type <code>user@host</code> in the sidebar search box and press Enter for a fast connection.</li>
              </ul>
            </div>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h3 style={{ borderBottom: '2px solid #27ae60', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', color: '#27ae60' }}>
              <LayoutGrid size={20} /> Split Modes & Layouts
            </h3>
            <p>Work with multiple terminals at the same time using the Split function.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '10px' }}>
              <div style={{ border: '1px solid #eee', padding: '10px', borderRadius: '4px' }}>
                <b style={{ color: '#27ae60' }}>Single Mode:</b> One terminal at a time, use tabs to switch.
              </div>
              <div style={{ border: '1px solid #eee', padding: '10px', borderRadius: '4px' }}>
                <b style={{ color: '#27ae60' }}>Multi-Terminal:</b> Choose between 2 (vertical/horizontal) or 4 (grid) screens.
              </div>
            </div>
            <p style={{ marginTop: '10px', fontSize: '13px', color: '#666' }}><i>Note: Terminal history is preserved even when switching between these modes!</i></p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h3 style={{ borderBottom: '2 solid #8e44ad', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', color: '#8e44ad' }}>
              <FileText size={20} /> SFTP & File Management
            </h3>
            <p>When connected to an SSH session, you can use the SFTP sidebar to manage remote files.</p>
            <ul style={{ paddingLeft: '20px' }}>
              <li><b>Drag & Drop:</b> Upload files by dragging them into the SFTP panel.</li>
              <li><b>Double-Click:</b> Downloads files to your local machine.</li>
              <li><b>Context Menu:</b> Right-click files to rename, delete, or view properties.</li>
            </ul>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h3 style={{ borderBottom: '2px solid #e74c3c', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', color: '#e74c3c' }}>
              <Lock size={20} /> Security & Vault (Cofre de Senhas)
            </h3>
            <p>O Password Vault é um recurso de segurança que permite armazenar suas senhas de sessão de forma criptografada, protegidas por uma <b>Senha Mestre</b>.</p>
            
            <div style={{ marginTop: '15px' }}>
              <b style={{ color: '#e74c3c' }}>1- Arquitetura de Segurança (Como Funciona)</b>
              <ul style={{ paddingLeft: '20px', marginTop: '5px' }}>
                <li><b>Criptografia:</b> Utiliza o algoritmo <b>AES-256-GCM</b>, um padrão de nível militar para garantir confidencialidade e integridade.</li>
                <li><b>Derivação de Chave:</b> A chave de criptografia é gerada via <b>PBKDF2-SHA512</b> com <b>100.000 iterações</b>, tornando ataques de força bruta extremamente difíceis.</li>
                <li><b>Armazenamento Seguro:</b> O servidor nunca armazena sua senha mestre. Apenas um hash criptográfico (scrypt) é guardado para validação.</li>
              </ul>
            </div>

            <div style={{ marginTop: '15px' }}>
              <b style={{ color: '#e74c3c' }}>2- Fluxo de Utilização</b>
              <ul style={{ paddingLeft: '20px', marginTop: '5px' }}>
                <li><b>Ativação:</b> Configure sua senha em <i>Settings → Password Vault</i> ou na aba <i>Tools</i>.</li>
                <li><b>Desbloqueio:</b> O sistema solicitará a senha mestre ao tentar acessar credenciais salvas pela primeira vez na sessão.</li>
                <li><b>Segurança Volátil:</b> A senha mestre é mantida apenas no <code>sessionStorage</code>, sendo apagada automaticamente ao fechar a aba ou o navegador.</li>
              </ul>
            </div>

            <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#fff5f5', borderLeft: '4px solid #e74c3c', fontSize: '13px' }}>
              <b>Conclusão:</b> O Password Vault garante que, mesmo em caso de acesso não autorizado ao banco de dados, suas credenciais permaneçam protegidas pela sua senha mestre única.
            </div>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h3 style={{ borderBottom: '2px solid #f39c12', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', color: '#f39c12' }}>
              <Clock size={20} /> Logs & Auditing
            </h3>
            <p>All activity is logged automatically. Access past sessions through the <b>Logs</b> tab in the sidebar. You can search by host name or date and preview up to 1000 lines of history.</p>
          </section>

        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'center', backgroundColor: '#f8f9fa' }}>
          <button 
            onClick={onClose}
            style={{ padding: '8px 30px', backgroundColor: '#005a9e', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' }}
          >
            Got it!
          </button>
        </div>

      </div>
    </div>
  );
};

export default HelpDialog;
