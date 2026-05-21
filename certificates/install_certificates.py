import os
import sys
import platform
import subprocess
import shutil

CERT_FILE = "xterm.crt"
CERT_NAME = "xtermweb_local.crt"

def check_admin():
    """Verifica se o script está sendo executado como Administrador/Root."""
    os_name = platform.system()
    if os_name == "Windows":
        try:
            import ctypes
            return ctypes.windll.shell32.IsUserAnAdmin() != 0
        except Exception:
            return False
    else:
        return os.geteuid() == 0

def install_windows():
    """Instala o certificado no Windows usando certutil."""
    print(f"Instalando {CERT_FILE} no Windows...")
    try:
        # Executa o comando certutil para adicionar o certificado na raiz de confiança
        result = subprocess.run(
            ["certutil", "-addstore", "Root", CERT_FILE],
            capture_output=True,
            text=True
        )
        if result.returncode == 0:
            print("Certificado instalado com sucesso no Windows!")
        else:
            print(f"Falha ao instalar o certificado.\nErro: {result.stderr or result.stdout}")
    except Exception as e:
        print(f"Ocorreu um erro durante a instalação: {e}")

def install_linux():
    """Instala o certificado no Linux."""
    print(f"Instalando {CERT_FILE} no Linux...")
    
    # Caminho onde o certificado será copiado
    cert_dest = f"/etc/ssl/certs/{CERT_NAME}"
    
    try:
        # Copia o arquivo
        shutil.copy(CERT_FILE, cert_dest)
        
        # Atualiza os certificados do sistema
        result = subprocess.run(
            ["update-ca-certificates"],
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            print("Certificado instalado e cache atualizado com sucesso no Linux!")
        else:
            print(f"O certificado foi copiado, mas houve um aviso ao atualizar o cache.\nSaída: {result.stderr or result.stdout}")
    except FileNotFoundError:
        print("Comando 'update-ca-certificates' não encontrado. O certificado foi copiado, mas talvez seu sistema exija outro comando (como 'update-ca-trust').")
    except Exception as e:
        print(f"Ocorreu um erro durante a instalação: {e}")

def main():
    print("--- Instalador de Certificados Xterm-Web ---")
    
    # Verifica se o arquivo do certificado existe na mesma pasta do script
    if not os.path.exists(CERT_FILE):
        print(f"ERRO: Arquivo de certificado '{CERT_FILE}' não encontrado na pasta atual.")
        print("Certifique-se de que o script e o certificado estão no mesmo diretório.")
        sys.exit(1)

    # Verifica permissões
    if not check_admin():
        print("ERRO: Permissão negada!")
        if platform.system() == "Windows":
            print("Por favor, execute o terminal/prompt de comando como Administrador e tente novamente.")
        else:
            print("Por favor, execute este script usando 'sudo' (ex: sudo python3 install_certificates.py).")
        sys.exit(1)

    # Identifica o SO e executa a rotina apropriada
    os_name = platform.system()
    if os_name == "Windows":
        install_windows()
    elif os_name == "Linux":
         install_linux()
    else:
        print(f"Sistema operacional não suportado: {os_name}")
        sys.exit(1)

if __name__ == "__main__":
    main()