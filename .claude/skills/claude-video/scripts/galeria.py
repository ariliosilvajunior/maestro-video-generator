"""galeria.py: abre a galeria de estilos no seu navegador (Etapa A).

uso: python3 scripts/galeria.py [--no-open] [--port 0] [--minutes 240] [--foreground]

O que ele faz, nesta ordem:
1. Se já existe uma galeria desta skill no ar (portas 8770 a 8799), reaproveita: só abre o navegador nela.
2. Senão, serve a pasta galeria/ numa porta local livre, só neste computador (127.0.0.1), em um processo
   separado que continua vivo depois que este comando volta. Não precisa de "&", "nohup" nem rodar em
   segundo plano por fora: o comando volta na hora, com o endereço impresso.
3. Abre o navegador padrão e imprime o endereço. A galeria para sozinha depois de --minutes (padrão 240).

--foreground serve neste mesmo processo (Ctrl-C para parar). Só biblioteca padrão. Aceita busca dentro do
vídeo (HTTP Range). Nunca abra galeria/index.html direto como arquivo: sem o servidor os vídeos não carregam.
"""
import argparse, os, re, socket, subprocess, sys, tempfile, threading, time, webbrowser
from functools import partial
from http.server import SimpleHTTPRequestHandler
try:
    from http.server import ThreadingHTTPServer
except ImportError:  # Python < 3.7
    from http.server import HTTPServer
    from socketserver import ThreadingMixIn

    class ThreadingHTTPServer(ThreadingMixIn, HTTPServer):
        daemon_threads = True
try:
    from urllib.request import urlopen
except ImportError:
    urlopen = None

ROOT = os.path.realpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'galeria'))
MARCA = 'claude-video-galeria'
PORTAS = range(8770, 8800)
LOG = os.path.join(tempfile.gettempdir(), 'claude-video-galeria.log')


class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        # /_ok responde quem é esta galeria: o script usa isso para reaproveitar uma galeria já no ar,
        # e a página usa para saber se o servidor continua vivo.
        if self.path.split('?')[0] == '/_ok':
            body = ('%s\n%s\n' % (MARCA, ROOT)).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'text/plain; charset=utf-8')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        return super().do_GET()

    def send_head(self):
        path = self.translate_path(self.path)
        rng = self.headers.get('Range')
        if not rng or not os.path.isfile(path):
            return super().send_head()
        size = os.path.getsize(path)
        m = re.match(r'bytes=(\d*)-(\d*)', rng)
        if not m:
            return super().send_head()
        start = int(m.group(1)) if m.group(1) else max(0, size - int(m.group(2) or 0))
        end = int(m.group(2)) if m.group(1) and m.group(2) else size - 1
        end = min(end, size - 1)
        if start > end:
            self.send_error(416)
            return None
        f = open(path, 'rb')
        f.seek(start)
        self.send_response(206)
        self.send_header('Content-Type', self.guess_type(path))
        self.send_header('Accept-Ranges', 'bytes')
        self.send_header('Content-Range', 'bytes %d-%d/%d' % (start, end, size))
        self.send_header('Content-Length', str(end - start + 1))
        self.end_headers()
        self._left = end - start + 1
        return f

    def copyfile(self, src, dst):
        left = getattr(self, '_left', None)
        if left is None:
            try:
                return super().copyfile(src, dst)
            except (BrokenPipeError, ConnectionResetError):
                return
        while left > 0:
            buf = src.read(min(65536, left))
            if not buf:
                break
            try:
                dst.write(buf)
            except (BrokenPipeError, ConnectionResetError):
                break
            left -= len(buf)
        self._left = None

    def end_headers(self):
        self.send_header('Accept-Ranges', 'bytes')
        self.send_header('Cache-Control', 'no-cache')
        self.send_header('X-Galeria', MARCA)
        super().end_headers()

    def log_message(self, *a):
        pass


def galeria_no_ar(port, timeout=0.4):
    """True se a porta responde como uma galeria desta mesma pasta."""
    if urlopen is None:
        return False
    try:
        with urlopen('http://127.0.0.1:%d/_ok' % port, timeout=timeout) as r:
            linhas = r.read(4096).decode('utf-8', 'replace').splitlines()
        return len(linhas) >= 2 and linhas[0] == MARCA and os.path.realpath(linhas[1]) == ROOT
    except Exception:
        return False


def achar_no_ar():
    for p in PORTAS:
        if galeria_no_ar(p):
            return p
    return None


def porta_livre(want):
    if want:
        return want
    for p in PORTAS:
        with socket.socket() as s:
            try:
                s.bind(('127.0.0.1', p))
                return p
            except OSError:
                continue
    with socket.socket() as s:
        s.bind(('127.0.0.1', 0))
        return s.getsockname()[1]


def abrir(url):
    try:
        webbrowser.open(url)
    except Exception:
        pass


def servir(port, minutes):
    """Serve até o tempo acabar (ou Ctrl-C). Roda no processo que vai ficar vivo."""
    httpd = ThreadingHTTPServer(('127.0.0.1', port), partial(Handler, directory=ROOT))
    print('Galeria: http://127.0.0.1:%d/  (no ar por %g min; pasta %s)' % (port, minutes, ROOT), flush=True)
    threading.Timer(minutes * 60, httpd.shutdown).start()
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    os._exit(0)


def destacar(port, minutes):
    """Sobe o servidor num processo separado, que sobrevive ao fim deste comando."""
    cmd = [sys.executable, os.path.abspath(__file__), '--_servir', '--port', str(port), '--minutes', str(minutes)]
    kw = {}
    if os.name == 'nt':
        kw['creationflags'] = 0x00000008 | 0x00000200  # DETACHED_PROCESS | CREATE_NEW_PROCESS_GROUP
    else:
        kw['start_new_session'] = True
    with open(LOG, 'ab') as log:
        subprocess.Popen(cmd, stdin=subprocess.DEVNULL, stdout=log, stderr=log, close_fds=True, **kw)
    for _ in range(80):  # até 8 s para o servidor responder
        if galeria_no_ar(port, timeout=0.2):
            return True
        time.sleep(0.1)
    return False


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--no-open', action='store_true', help='não abre o navegador, só imprime o endereço')
    ap.add_argument('--port', type=int, default=0)
    ap.add_argument('--minutes', type=float, default=240)
    ap.add_argument('--foreground', action='store_true', help='serve neste processo (Ctrl-C para parar)')
    ap.add_argument('--_servir', action='store_true', help=argparse.SUPPRESS)
    a = ap.parse_args()

    if a._servir:
        servir(a.port, a.minutes)
        return

    if not os.path.isfile(os.path.join(ROOT, 'index.html')):
        print('Não achei a galeria em %s. A skill está incompleta; instale de novo.' % ROOT)
        sys.exit(1)

    ja = achar_no_ar()
    if ja and not (a.port and a.port != ja):
        url = 'http://127.0.0.1:%d/' % ja
        print('Galeria já no ar: %s  (reaproveitada)' % url, flush=True)
        if not a.no_open:
            abrir(url)
        return

    port = porta_livre(a.port)
    url = 'http://127.0.0.1:%d/' % port
    if a.foreground:
        if not a.no_open:
            threading.Timer(0.5, abrir, [url]).start()
        servir(port, a.minutes)
        return

    if not destacar(port, a.minutes):
        print('A galeria não subiu. Veja o registro em %s ou rode com --foreground para ver o erro.' % LOG)
        sys.exit(1)
    print('Galeria: %s  (no ar por %g min, em segundo plano; para sozinha depois)' % (url, a.minutes), flush=True)
    if not a.no_open:
        abrir(url)


if __name__ == '__main__':
    main()
