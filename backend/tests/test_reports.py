import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.modules.auth.repository import repository as users
from app.modules.children.repository import repository as kids
from app.modules.sessions.repository import repository as sessions

client = TestClient(app)

def setup_function():
    users.clear(); kids.clear(); sessions.clear()

def register(email='rel@example.com'):
    t = client.post('/api/auth/register', json={'name':'Responsável','email':email,'password':'SenhaForte123','accepted_terms':True}).json()['access_token']
    return {'Authorization': f'Bearer {t}'}

def child(h, name='Ana'):
    return client.post('/api/children', json={'name':name,'age':8}, headers=h).json()['id']

def play(h, cid, game, ok, err, done, dur, at):
    assert client.post('/api/sessions', json={'child_id':cid,'game_id':game,'correct_answers':ok,'incorrect_answers':err,
        'completed':done,'duration_seconds':dur,'played_at':at}, headers=h).status_code == 201

def seed(h):
    cid = child(h)
    play(h, cid, 'cores', 5, 0, True, 60, '2026-11-10T10:00:00+00:00')
    play(h, cid, 'ligar', 5, 5, True, 100, '2026-11-11T10:00:00+00:00')
    play(h, cid, 'ligar', 2, 3, False, 30, '2026-11-20T10:00:00+00:00')   # fora do período
    return cid

def gen(h, cid, s='2026-11-01', e='2026-11-15'):
    return client.post('/api/reports', json={'child_id':cid,'period_start':s,'period_end':e}, headers=h)

def test_generate_stores_text_for_period_only():
    h = register(); cid = seed(h)
    r = gen(h, cid); assert r.status_code == 201
    b = r.json()
    assert b['sent'] is False and b['sent_at'] is None and b['child_name'] == 'Ana'
    assert 'Jogou 2 vezes e terminou 2 jogos.' in b['text'] and '01/11/2026 a 15/11/2026' in b['text']
    assert 'Nível: Fácil (8 anos)' in b['text']
    assert '- Acerte a cor: está fácil.' in b['text'] and '- Ligue ao nome: está difícil.' in b['text']

def test_generate_without_matches():
    h = register(); cid = child(h)
    b = gen(h, cid).json()
    assert 'Não houve jogos neste período.' in b['text']

def test_list_filter_and_read():
    h = register(); cid = seed(h); other = child(h, 'Beto')
    a = gen(h, cid).json(); gen(h, other)
    assert len(client.get('/api/reports', headers=h).json()) == 2
    assert [x['id'] for x in client.get(f'/api/reports?child_id={cid}', headers=h).json()] == [a['id']]
    assert client.get(f"/api/reports/{a['id']}", headers=h).json()['text'] == a['text']

def test_status_and_mark_sent():
    h = register(); cid = seed(h); rid = gen(h, cid).json()['id']
    assert client.get(f'/api/reports/{rid}/status', headers=h).json()['sent'] is False
    r = client.post(f'/api/reports/{rid}/sent', headers=h)
    assert r.status_code == 200 and r.json()['sent'] is True and r.json()['sent_at']
    st = client.get(f'/api/reports/{rid}/status', headers=h).json()
    assert st['sent'] is True and st['sent_at']
    assert client.post(f'/api/reports/{rid}/sent', headers=h).status_code == 409
    assert len(client.get('/api/reports?sent=true', headers=h).json()) == 1
    assert client.get('/api/reports?sent=false', headers=h).json() == []

def test_invalid_period():
    h = register(); cid = child(h)
    assert gen(h, cid, '2026-11-15', '2026-11-01').status_code == 422
    assert gen(h, cid, '2024-01-01', '2026-01-01').status_code == 422
    assert gen(h, cid, 'abc', '2026-01-01').status_code == 422

def test_isolation_and_permissions():
    h1 = register('a@example.com'); cid = seed(h1); rid = gen(h1, cid).json()['id']
    h2 = register('b@example.com')
    assert gen(h2, cid).status_code == 404
    for path in (f'/api/reports/{rid}', f'/api/reports/{rid}/status'):
        assert client.get(path, headers=h2).status_code == 404
    assert client.post(f'/api/reports/{rid}/sent', headers=h2).status_code == 404
    assert client.get('/api/reports', headers=h2).json() == []
    g = {'Authorization': 'Bearer ' + client.post('/api/auth/guest').json()['access_token']}
    assert client.get('/api/reports', headers=g).status_code == 403
    assert client.get('/api/reports').status_code == 401

def test_reports_deleted_with_child():
    h = register(); cid = seed(h); gen(h, cid)
    client.delete(f'/api/children/{cid}', headers=h)
    assert client.get('/api/reports', headers=h).json() == []

def test_report_ignores_abandoned_in_performance():
    h = register(); cid = child(h)
    play(h, cid, 'cores', 5, 0, True, 60, '2026-11-10T10:00:00+00:00')
    play(h, cid, 'ligar', 1, 4, False, 20, '2026-11-10T11:00:00+00:00')
    t = gen(h, cid).json()['text']
    assert 'Jogou 2 vezes e terminou 1 jogo.' in t
    assert 'Nos jogos que terminou: 5 acertos e 0 erros.' in t
    assert '- Ligue ao nome: está difícil. Começou 1 vez, mas ainda não terminou. Tudo bem!' in t

def test_report_only_abandoned():
    h = register(); cid = child(h)
    play(h, cid, 'cores', 0, 0, False, 5, '2026-11-10T10:00:00+00:00')
    t = gen(h, cid).json()['text']
    assert 'Ainda não terminou nenhum jogo neste período.' in t and 'acertos' not in t


def test_report_linguagem_simples_sem_termos_tecnicos():
    h = register(); cid = seed(h)
    t = gen(h, cid).json()['text']
    for termo in ('taxa de conclusão', 'partida(s)', 'concluída(s)', 'Discriminação', 'indicadores', 'Pontuação média'):
        assert termo not in t, termo


def test_report_dificuldade_por_jogo():
    h = register(); cid = child(h)
    play(h, cid, 'cores', 5, 0, True, 60, '2026-11-02T10:00:00+00:00')     # 0 erros  -> fácil
    play(h, cid, 'encaixe', 5, 3, True, 60, '2026-11-03T10:00:00+00:00')   # 3 erros  -> no ponto
    play(h, cid, 'ligar', 5, 6, True, 60, '2026-11-04T10:00:00+00:00')     # 6 erros  -> difícil
    play(h, cid, 'falar', 5, 0, True, 60, '2026-11-05T10:00:00+00:00')     # terminou 1, largou 2 -> difícil
    play(h, cid, 'falar', 1, 0, False, 10, '2026-11-05T11:00:00+00:00')
    play(h, cid, 'falar', 2, 0, False, 10, '2026-11-05T12:00:00+00:00')
    t = gen(h, cid).json()['text']
    assert '- Acerte a cor: está fácil. Terminou 1 de 1, com poucos erros.' in t
    assert '- Encaixe as formas: está no ponto. Terminou 1 de 1, com alguns erros.' in t
    assert '- Ligue ao nome: está difícil. Terminou 1 de 1, com muitos erros.' in t
    assert '- Vamos falar: está difícil. Terminou 1 de 3, e deixou outros pela metade.' in t
    assert t.index('Acerte a cor: está fácil') < t.index('Encaixe as formas: está no ponto') < t.index('Ligue ao nome: está difícil')
    assert 'Vale jogar Ligue ao nome e Vamos falar mais vezes' in t


@pytest.mark.parametrize('idade,nivel', [(5, 'Fácil'), (9, 'Médio'), (12, 'Avançado')])
def test_report_mostra_nivel_pela_idade(idade, nivel):
    h = register(); cid = client.post('/api/children', json={'name': 'Bia', 'age': idade}, headers=h).json()['id']
    t = gen(h, cid).json()['text']
    assert f'Nível: {nivel} ({idade} anos)' in t


def test_report_todos_faceis():
    h = register(); cid = child(h)
    play(h, cid, 'cores', 5, 1, True, 60, '2026-11-02T10:00:00+00:00')
    t = gen(h, cid).json()['text']
    assert 'Os jogos estão fáceis para Ana neste nível.' in t


def test_report_metrics_returns_period_breakdown_and_respects_isolation():
    h1 = register('metrics1@example.com'); cid = seed(h1)
    rid = gen(h1, cid).json()['id']

    resp = client.get(f'/api/reports/{rid}/metrics', headers=h1)
    assert resp.status_code == 200
    data = resp.json()
    assert data['report_id'] == rid
    assert data['child_name'] == 'Ana' and data['child_age'] == 8
    assert data['summary']['total_matches'] == 2
    assert data['summary']['completed_matches'] == 2
    assert data['summary']['abandoned_matches'] == 0
    assert data['summary']['total_correct'] == 10
    assert data['summary']['total_errors'] == 5
    assert [e['date'] for e in data['evolution']] == ['2026-11-10', '2026-11-11']
    assert len(data['recent_matches']) == 2
    by_id = {g['game_id']: g for g in data['games']}
    assert by_id['cores']['average_score'] == 100.0
    assert by_id['ligar']['average_score'] == 50.0
    assert by_id['ligar']['total_errors'] == 5

    h2 = register('metrics2@example.com')
    assert client.get(f'/api/reports/{rid}/metrics', headers=h2).status_code == 404
    assert client.get(f'/api/reports/{rid}/metrics').status_code == 401
