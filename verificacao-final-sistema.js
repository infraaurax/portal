import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase com as credenciais corretas do .env
const supabaseUrl = 'https://bxravbirihbuyfkvhqpr.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4cmF2YmlyaWhidXlma3ZocXByIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDU4OTg1NywiZXhwIjoyMDcwMTY1ODU3fQ.wOcOdHfqlietZJrYQeTmbjTpL-d6yw85KJb-bDOlFWU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🎯 === VERIFICAÇÃO FINAL DO SISTEMA ===\n');

async function verificarOperadores() {
    try {
        console.log('1️⃣ VERIFICANDO OPERADORES:');
        
        const { data, error } = await supabase
            .from('operadores')
            .select('id, nome, email, perfil, habilitado, online, pos_token, status');
        
        if (error) {
            console.error('❌ Erro ao verificar operadores:', error);
            return;
        }
        
        console.log(`✅ Total de operadores: ${data.length}`);
        
        const operadoresOnline = data.filter(op => op.habilitado && op.online);
        console.log(`✅ Operadores online: ${operadoresOnline.length}`);
        
        operadoresOnline.forEach(op => {
            console.log(`   - ${op.nome} (${op.perfil}) - pos_token: ${op.pos_token}`);
        });
        
        return operadoresOnline.length > 0;
        
    } catch (error) {
        console.error('❌ Erro:', error);
        return false;
    }
}

async function verificarFilaAtendimentos() {
    try {
        console.log('\n2️⃣ VERIFICANDO FILA DE ATENDIMENTOS:');
        
        const { data, error } = await supabase
            .from('fila_atendimentos')
            .select(`
                id, 
                atendimento_id, 
                status, 
                prioridade, 
                operador_id,
                created_at,
                atendimentos(cliente_nome, cliente_email)
            `);
        
        if (error) {
            console.error('❌ Erro ao verificar fila:', error);
            return;
        }
        
        console.log(`✅ Total de itens na fila: ${data.length}`);
        
        const aguardando = data.filter(item => item.status === 'aguardando');
        const oferecidos = data.filter(item => item.status === 'oferecido');
        
        console.log(`   - Aguardando: ${aguardando.length}`);
        console.log(`   - Oferecidos: ${oferecidos.length}`);
        
        if (data.length > 0) {
            console.log('\n📋 Detalhes da fila:');
            data.forEach(item => {
                const cliente = item.atendimentos?.cliente_nome || 'N/A';
                console.log(`   - ${item.atendimento_id} | ${cliente} | Status: ${item.status} | Prioridade: ${item.prioridade}`);
            });
        }
        
        return data.length;
        
    } catch (error) {
        console.error('❌ Erro:', error);
        return 0;
    }
}

async function verificarOfertasOperador() {
    try {
        console.log('\n3️⃣ VERIFICANDO OFERTAS PARA OPERADORES:');
        
        const { data, error } = await supabase
            .from('ofertas_operador')
            .select(`
                id, 
                atendimento_id, 
                operador_id, 
                status, 
                created_at,
                operadores(nome),
                atendimentos(cliente_nome)
            `);
        
        if (error) {
            console.error('❌ Erro ao verificar ofertas:', error);
            return;
        }
        
        console.log(`✅ Total de ofertas: ${data.length}`);
        
        const pendentes = data.filter(oferta => oferta.status === 'pendente');
        const aceitas = data.filter(oferta => oferta.status === 'aceita');
        const rejeitadas = data.filter(oferta => oferta.status === 'rejeitada');
        
        console.log(`   - Pendentes: ${pendentes.length}`);
        console.log(`   - Aceitas: ${aceitas.length}`);
        console.log(`   - Rejeitadas: ${rejeitadas.length}`);
        
        if (pendentes.length > 0) {
            console.log('\n📋 Ofertas pendentes:');
            pendentes.forEach(oferta => {
                const operador = oferta.operadores?.nome || 'N/A';
                const cliente = oferta.atendimentos?.cliente_nome || 'N/A';
                console.log(`   - ${cliente} → ${operador} (${oferta.status})`);
            });
        }
        
        return data.length;
        
    } catch (error) {
        console.error('❌ Erro:', error);
        return 0;
    }
}

async function testarFuncaoDistribuicao() {
    try {
        console.log('\n4️⃣ TESTANDO FUNÇÃO DE DISTRIBUIÇÃO:');
        
        const { data, error } = await supabase.rpc('executar_distribuicao_automatica');
        
        if (error) {
            console.error('❌ Erro na função de distribuição:', error);
            return false;
        }
        
        console.log('✅ Função de distribuição funcionando!');
        console.log('📊 Resultado:', data);
        return true;
        
    } catch (error) {
        console.error('❌ Erro:', error);
        return false;
    }
}

async function main() {
    console.log('🚀 Iniciando verificação final do sistema...\n');
    
    // Verificações
    const operadoresOk = await verificarOperadores();
    const filaCount = await verificarFilaAtendimentos();
    const ofertasCount = await verificarOfertasOperador();
    const distribuicaoOk = await testarFuncaoDistribuicao();
    
    // Resumo final
    console.log('\n🎯 === RESUMO FINAL ===');
    console.log(`✅ Operadores online: ${operadoresOk ? 'SIM' : 'NÃO'}`);
    console.log(`✅ Itens na fila: ${filaCount}`);
    console.log(`✅ Ofertas ativas: ${ofertasCount}`);
    console.log(`✅ Distribuição funcionando: ${distribuicaoOk ? 'SIM' : 'NÃO'}`);
    
    if (operadoresOk && distribuicaoOk) {
        console.log('\n🎉 SISTEMA FUNCIONANDO CORRETAMENTE!');
        console.log('✅ Todos os componentes estão operacionais');
        console.log('✅ O sistema está pronto para receber e distribuir atendimentos');
    } else {
        console.log('\n⚠️  SISTEMA COM PROBLEMAS:');
        if (!operadoresOk) console.log('❌ Não há operadores online');
        if (!distribuicaoOk) console.log('❌ Função de distribuição com erro');
    }
}

main().catch(console.error);