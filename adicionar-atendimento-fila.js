import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase com as credenciais corretas do .env
const supabaseUrl = 'https://bxravbirihbuyfkvhqpr.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4cmF2YmlyaWhidXlma3ZocXByIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDU4OTg1NywiZXhwIjoyMDcwMTY1ODU3fQ.wOcOdHfqlietZJrYQeTmbjTpL-d6yw85KJb-bDOlFWU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🎯 Adicionando atendimentos aguardando à fila inteligente...\n');

async function buscarAtendimentosAguardando() {
    try {
        console.log('🔍 Buscando atendimentos com status "aguardando"...');
        
        const { data, error } = await supabase
            .from('atendimentos')
            .select('id, cliente_nome, cliente_email, status, created_at')
            .eq('status', 'aguardando');
        
        if (error) {
            console.error('❌ Erro ao buscar atendimentos:', error);
            return [];
        }
        
        console.log(`✅ Encontrados ${data.length} atendimentos aguardando`);
        return data;
        
    } catch (error) {
        console.error('❌ Erro:', error);
        return [];
    }
}

async function verificarSeJaEstaNaFila(atendimentoId) {
    try {
        const { data, error } = await supabase
            .from('fila_atendimentos')
            .select('id')
            .eq('atendimento_id', atendimentoId)
            .single();
        
        if (error && error.code !== 'PGRST116') { // PGRST116 = not found
            console.error('❌ Erro ao verificar fila:', error);
            return false;
        }
        
        return !!data;
        
    } catch (error) {
        console.error('❌ Erro:', error);
        return false;
    }
}

async function adicionarAtendimentoNaFila(atendimento) {
    try {
        console.log(`📝 Adicionando atendimento ${atendimento.id} na fila...`);
        
        const { data, error } = await supabase
            .from('fila_atendimentos')
            .insert({
                atendimento_id: atendimento.id,
                status: 'aguardando',
                prioridade: 1, // Prioridade padrão
                created_at: new Date().toISOString()
            })
            .select()
            .single();
        
        if (error) {
            console.error(`❌ Erro ao adicionar atendimento ${atendimento.id}:`, error);
            return false;
        }
        
        console.log(`✅ Atendimento ${atendimento.id} adicionado à fila com sucesso!`);
        return true;
        
    } catch (error) {
        console.error('❌ Erro:', error);
        return false;
    }
}

async function executarDistribuicaoAutomatica() {
    try {
        console.log('\n🚀 Executando distribuição automática...');
        
        const { data, error } = await supabase.rpc('executar_distribuicao_automatica');
        
        if (error) {
            console.error('❌ Erro na distribuição:', error);
            return false;
        }
        
        console.log('✅ Distribuição executada:', data);
        return true;
        
    } catch (error) {
        console.error('❌ Erro:', error);
        return false;
    }
}

async function main() {
    console.log('🚀 Iniciando processo de adição à fila...\n');
    
    // Buscar atendimentos aguardando
    const atendimentosAguardando = await buscarAtendimentosAguardando();
    
    if (atendimentosAguardando.length === 0) {
        console.log('✅ Não há atendimentos aguardando para adicionar à fila');
        return;
    }
    
    let adicionados = 0;
    
    // Processar cada atendimento
    for (const atendimento of atendimentosAguardando) {
        console.log(`\n📋 Processando atendimento:`);
        console.log(`   - ID: ${atendimento.id}`);
        console.log(`   - Cliente: ${atendimento.cliente_nome || 'N/A'}`);
        console.log(`   - Email: ${atendimento.cliente_email || 'N/A'}`);
        console.log(`   - Criado em: ${new Date(atendimento.created_at).toLocaleString('pt-BR')}`);
        
        // Verificar se já está na fila
        const jaEstaNaFila = await verificarSeJaEstaNaFila(atendimento.id);
        
        if (jaEstaNaFila) {
            console.log(`⚠️  Atendimento ${atendimento.id} já está na fila`);
            continue;
        }
        
        // Adicionar à fila
        const sucesso = await adicionarAtendimentoNaFila(atendimento);
        if (sucesso) {
            adicionados++;
        }
    }
    
    console.log(`\n📊 Resumo:`);
    console.log(`   - Atendimentos encontrados: ${atendimentosAguardando.length}`);
    console.log(`   - Atendimentos adicionados à fila: ${adicionados}`);
    
    if (adicionados > 0) {
        // Executar distribuição automática
        await executarDistribuicaoAutomatica();
    }
    
    console.log('\n🎉 Processo concluído!');
}

main().catch(console.error);