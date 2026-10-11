const test = require('node:test');
const assert = require('node:assert/strict');

function carregarBackup(){
  const caminho = require.resolve('../github-backup');
  delete require.cache[caminho];
  return require('../github-backup');
}

test('informa quando o backup do GitHub não está configurado', () => {
  const anteriores = [process.env.GITHUB_DATA_OWNER, process.env.GITHUB_DATA_REPO, process.env.GITHUB_DATA_TOKEN];
  delete process.env.GITHUB_DATA_OWNER; delete process.env.GITHUB_DATA_REPO; delete process.env.GITHUB_DATA_TOKEN;
  const backup = carregarBackup();
  assert.equal(backup.status().configurado, false);
  [process.env.GITHUB_DATA_OWNER, process.env.GITHUB_DATA_REPO, process.env.GITHUB_DATA_TOKEN] = anteriores;
});

test('cria e depois atualiza o JSON privado usando o sha atual', async () => {
  const anteriores = {
    owner:process.env.GITHUB_DATA_OWNER, repo:process.env.GITHUB_DATA_REPO,
    token:process.env.GITHUB_DATA_TOKEN
  };
  process.env.GITHUB_DATA_OWNER='rgbittencourt';
  process.env.GITHUB_DATA_REPO='avaliador-podcast-dados';
  process.env.GITHUB_DATA_TOKEN='token-de-teste';
  const backup = carregarBackup();
  const chamadas=[];
  const fetchAnterior=global.fetch;
  global.fetch=async (url, opcoes={})=>{
    chamadas.push({url, opcoes});
    if(!opcoes.method) return {ok:true, json:async()=>({sha:'sha-atual'})};
    return {ok:true, json:async()=>({content:{sha:'sha-novo'}})};
  };
  try{
    const status=await backup.sincronizar({version:2,turmas:[]});
    assert.equal(status.ultimoErro, null);
    assert.ok(status.ultimaSincronizacao);
    assert.equal(chamadas.length, 2);
    const corpo=JSON.parse(chamadas[1].opcoes.body);
    assert.equal(corpo.sha, 'sha-atual');
    assert.equal(JSON.parse(Buffer.from(corpo.content,'base64').toString('utf8')).version, 2);
    assert.doesNotMatch(JSON.stringify(status), /token-de-teste/);
  }finally{
    global.fetch=fetchAnterior;
    if(anteriores.owner===undefined) delete process.env.GITHUB_DATA_OWNER; else process.env.GITHUB_DATA_OWNER=anteriores.owner;
    if(anteriores.repo===undefined) delete process.env.GITHUB_DATA_REPO; else process.env.GITHUB_DATA_REPO=anteriores.repo;
    if(anteriores.token===undefined) delete process.env.GITHUB_DATA_TOKEN; else process.env.GITHUB_DATA_TOKEN=anteriores.token;
  }
});
