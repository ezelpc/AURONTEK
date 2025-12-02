import os
import sys
from datetime import datetime


def init_logger():
    """Inicializa logger para ia-svc.
    - Si BRANCH != 'main' imprime en stdout con prefijo de rama.
    - Si BRANCH == 'main' escribe a archivo en LOG_DIR/app.log con permisos restrictivos.
    """
    branch = os.getenv('BRANCH') or os.getenv('GIT_BRANCH') or os.getenv('NODE_ENV') or 'dev'
    normalized = branch.lower()
    is_main = normalized in ('main', 'production', 'prod')

    if not is_main:
        prefix = f'[{normalized}]'

        def _print(*args, **kwargs):
            sys.stdout.write(prefix + ' ' + ' '.join(map(str, args)) + '\n')

        # Rebind print to include prefix
        builtins = __import__('builtins')
        builtins.print = _print
        return

    # main: log to file
    log_dir = os.getenv('LOG_DIR', '/var/log/aurontek')
    log_file = os.path.join(log_dir, os.getenv('LOG_FILE', 'ia.log'))

    try:
        if not os.path.exists(log_dir):
            os.makedirs(log_dir, mode=0o700, exist_ok=True)
        else:
            try:
                os.chmod(log_dir, 0o700)
            except Exception:
                pass

        if not os.path.exists(log_file):
            fd = os.open(log_file, os.O_WRONLY | os.O_CREAT, 0o600)
            os.close(fd)
        else:
            try:
                os.chmod(log_file, 0o600)
            except Exception:
                pass
    except Exception as e:
        sys.stderr.write(f"Logger init error: {e}\n")
        return

    def file_print(*args, **kwargs):
        try:
            message = ' '.join(map(str, args))
            line = f"{datetime.utcnow().isoformat()} {message}\n"
            with open(log_file, 'a', encoding='utf-8') as f:
                f.write(line)
        except Exception as e:
            sys.stderr.write(f"Logger write error: {e}\n")

    builtins = __import__('builtins')
    builtins.print = file_print


if __name__ == '__main__':
    init_logger()
