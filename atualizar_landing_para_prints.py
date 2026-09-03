from pathlib import Path

arquivo = Path('src/app/page.tsx')
texto = arquivo.read_text(encoding='utf-8')

marcador = "const FAQS = ["
bloco_demos = """const DEMOS = [
  { id: 'dashboard', label: 'Visão geral', imagem: '/videos/demo-dashboard.png' },
  { id: 'pdv', label: 'PDV', imagem: '/videos/demo-pdv.png' },
  { id: 'relatorios', label: 'Relatórios', imagem: '/videos/demo-relatorios.png' },
  { id: 'raio-x', label: 'Raio-X', imagem: '/videos/demo-raio-x.png' },
] as const

type DemoId = (typeof DEMOS)[number]['id']

"""

if 'const DEMOS = [' not in texto:
    if marcador not in texto:
        raise SystemExit('Não encontrei o bloco FAQS no arquivo.')
    texto = texto.replace(marcador, bloco_demos + marcador, 1)

estado_antigo = "const [demoAtiva, setDemoAtiva] = useState('dashboard')"
estado_novo = """const [demoAtiva, setDemoAtiva] = useState<DemoId>('dashboard')

  const demoSelecionada =
    DEMOS.find((demo) => demo.id === demoAtiva) ?? DEMOS[0]"""

if estado_antigo in texto:
    texto = texto.replace(estado_antigo, estado_novo, 1)
elif 'const demoSelecionada =' not in texto:
    raise SystemExit('Não encontrei o estado demoAtiva no formato esperado.')

botoes_antigos = """{[
                ['dashboard', 'Visão geral'],
                ['pdv', 'Venda'],
                ['alertas', 'Alertas'],
                ['relatorios', 'Relatórios'],
              ].map(([id, label]) => (
                <button
                  type=\"button\"
                  key={id}
                  onClick={() => setDemoAtiva(id)}
                  className={`rounded-full px-5 py-2.5 text-sm font-bold transition ${
                    demoAtiva === id
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                      : 'border border-gray-200 bg-white text-gray-600 hover:border-emerald-300 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300'
                  }`}
                >
                  {label}
                </button>
              ))}"""

botoes_novos = """{DEMOS.map((demo) => (
                <button
                  type=\"button\"
                  key={demo.id}
                  onClick={() => setDemoAtiva(demo.id)}
                  aria-pressed={demoAtiva === demo.id}
                  className={`rounded-full px-5 py-2.5 text-sm font-bold transition ${
                    demoAtiva === demo.id
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                      : 'border border-gray-200 bg-white text-gray-600 hover:border-emerald-300 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300'
                  }`}
                >
                  {demo.label}
                </button>
              ))}"""

if botoes_antigos in texto:
    texto = texto.replace(botoes_antigos, botoes_novos, 1)
elif '{DEMOS.map((demo)' not in texto:
    raise SystemExit('Não encontrei o bloco dos botões da demonstração.')

texto = texto.replace(
    'Escolha uma área e acompanhe uma demonstração curta da interface.',
    'Escolha uma área para conhecer a interface atual do sistema.',
    1,
)
texto = texto.replace(
    'EstoqueSystem · {demoAtiva}',
    'EstoqueSystem · {demoSelecionada.label}',
    1,
)

video_antigo = """<video
                  key={demoAtiva}
                  src={`/videos/demo-${demoAtiva}.mp4`}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload=\"metadata\"
                  className=\"block aspect-video w-full object-cover\"
                  aria-label={`Demonstração do EstoqueSystem: ${demoAtiva}`}
                >
                  Seu navegador não suporta vídeo HTML5.
                </video>"""

imagem_nova = """<div className=\"relative flex min-h-[220px] w-full items-center justify-center bg-gray-950 sm:min-h-[360px]\">
                  <img
                    key={demoSelecionada.id}
                    src={demoSelecionada.imagem}
                    alt={`Tela real do EstoqueSystem: ${demoSelecionada.label}`}
                    className=\"block h-auto max-h-[720px] w-full object-contain\"
                    loading=\"lazy\"
                  />
                </div>"""

if video_antigo in texto:
    texto = texto.replace(video_antigo, imagem_nova, 1)
elif 'src={demoSelecionada.imagem}' not in texto:
    raise SystemExit('Não encontrei o bloco de vídeo no formato esperado.')

arquivo.write_text(texto, encoding='utf-8')
print('OK: src/app/page.tsx atualizado para usar os quatro prints.')
