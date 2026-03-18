#!/usr/bin/env python3
"""Apply Brazilian Portuguese translations to lessons.json"""
import json
import sys
import os

def get_translations():
    """Return translations for lessons, keyed by dayNumber."""
    return {
        1: {
            "introduction": "Bem-vinda ao Dia 1 da sua jornada de bem-estar. Hoje marca o início de uma transformação linda que começa de dentro para fora.",
            "mainContent": "Sua jornada de bem-estar começa com a compreensão do seu 'porquê'. Não se trata de soluções rápidas ou mudanças temporárias — trata-se de criar uma vida cheia de energia, equilíbrio e alegria.\n\n**O Poder da Intenção**\n\nUma intenção é mais do que uma meta. Enquanto metas são alvos externos, intenções são compromissos internos. Quando você define uma intenção de bem-estar, está declarando como quer se sentir e quem quer se tornar.\n\n**Por Que o Seu 'Porquê' Importa**\n\nPesquisas mostram que pessoas que conectam suas metas de saúde a valores mais profundos — como estar presente para os filhos, ter energia para suas paixões ou se sentir confiante no próprio corpo — têm muito mais chances de manter mudanças duradouras.\n\nSeu 'porquê' se torna sua âncora quando os desafios aparecem. Ele transforma 'eu tenho que' em 'eu escolho'.",
            "keyTakeaways": [
                "Intenções são compromissos internos, não apenas metas externas",
                "Conectar-se ao seu 'porquê' mais profundo aumenta o sucesso duradouro",
                "Sua jornada de bem-estar é única — só sua"
            ],
            "actionStep": "Reserve 10 minutos hoje para escrever sua intenção de bem-estar. Inclua tanto o que deseja alcançar quanto, mais importante, como deseja se sentir. Coloque em um lugar onde você veja todos os dias.",
            "journalPrimary": "O que te trouxe a esta jornada de bem-estar? Que impacto alcançar seus objetivos terá na sua vida e nas pessoas que você ama?"
        },
        2: {
            "introduction": "A água é a base do bem-estar. Hoje, vamos explorar como a hidratação adequada transforma todos os aspectos da sua saúde.",
            "mainContent": "**Por Que a Água Importa**\n\nSeu corpo é aproximadamente 60% água. Cada célula, tecido e órgão depende de hidratação adequada para funcionar de forma ideal.\n\n**Benefícios da Hidratação Adequada**\n\n- **Suporte ao Metabolismo**: A água ajuda seu corpo a converter alimentos em energia de forma eficiente\n- **Regulação do Apetite**: Muitas vezes, o que parece fome na verdade é sede\n- **Aumento de Energia**: Até uma desidratação leve pode causar fadiga e confusão mental\n- **Saúde da Pele**: A hidratação adequada contribui para uma pele limpa e radiante\n- **Digestão**: A água auxilia na absorção de nutrientes e eliminação de resíduos\n\n**Quanta Água?**\n\nTente consumir cerca de 8 copos (2 litros) por dia como base. Aumente essa quantidade se você for ativa, estiver em clima quente ou consumir cafeína.\n\n**O Ritual da Hidratação**\n\nTransforme o ato de beber água de uma obrigação em um ritual:\n- Comece cada manhã com um copo de água\n- Beba um copo antes de cada refeição (isso também ajuda na digestão)\n- Mantenha a água visível e acessível ao longo do dia\n- Ouça os sinais de sede do seu corpo",
            "keyTakeaways": [
                "A água dá suporte ao metabolismo, energia e regulação do apetite",
                "Tente consumir 8 copos (2 litros) por dia como base",
                "Beber água antes das refeições ajuda na digestão e saciedade"
            ],
            "actionStep": "Hoje, acompanhe seu consumo de água. Programe um lembrete para beber um copo de água antes de cada refeição e ao acordar.",
            "journalPrimary": "Como seu nível de energia muda quando você está bem hidratada em comparação com quando esqueceu de beber água?"
        },
        3: {
            "introduction": "Seu corpo se comunica com você constantemente. Hoje, vamos aprender a ouvir com honestidade e compaixão.",
            "mainContent": "**A Arte da Consciência Corporal**\n\nAntes de mudar, precisamos primeiro entender onde estamos. Isso exige autoavaliação honesta — não julgamento, mas observação gentil.\n\n**Sinais Físicos para Observar**\n\n- Quando você se sente com mais energia?\n- Quais alimentos fazem você se sentir vibrante versus indisposta?\n- Como seu corpo se sente quando você se movimenta versus quando fica sedentária?\n- Como é a fome de verdade comparada à fome emocional?\n\n**Conexões Emocionais**\n\nNossos padrões alimentares frequentemente estão conectados às emoções:\n- Comer por estresse para buscar conforto\n- Comer como recompensa para comemorar\n- Comer por tédio para preencher o tempo\n- Comer restritivamente por ansiedade\n\n**Praticando a Consciência Honesta**\n\nHonestidade não significa autocrítica severa. Significa observar sem julgamento:\n- \"Percebo que busco doces quando estou estressada\"\n- \"Observo que me sinto cansada depois do almoço\"\n- \"Noto que pulo o café da manhã quando estou com pressa\"\n\nEssa consciência é a base para mudanças significativas.",
            "keyTakeaways": [
                "A consciência corporal começa com observação honesta e sem julgamento",
                "Sinais físicos revelam o que realmente te nutre",
                "Padrões emocionais frequentemente guiam comportamentos alimentares"
            ],
            "actionStep": "Hoje, antes de comer qualquer coisa, faça uma pausa de 30 segundos. Pergunte-se: Estou realmente com fome? O que meu corpo está pedindo de verdade? Anote suas observações.",
            "journalPrimary": "Que padrões você notou nos seus hábitos alimentares ou de movimento? Que emoções costumam acompanhar esses padrões?"
        },
        4: {
            "introduction": "Seu ambiente molda suas escolhas. Hoje, vamos transformar o que está ao seu redor para apoiar sua jornada de bem-estar.",
            "mainContent": "**Design do Ambiente**\n\nPesquisas mostram que nosso ambiente tem uma influência poderosa sobre nossos comportamentos. Ao planejar nossos espaços com cuidado, podemos tornar as escolhas saudáveis a opção natural.\n\n**A Revolução da Cozinha**\n\n- Mantenha frutas e legumes visíveis e acessíveis\n- Guarde os alimentos menos saudáveis em armários altos ou nos fundos\n- Tenha uma garrafa de água sempre visível\n- Organize sua geladeira com opções saudáveis na altura dos olhos\n\n**A Configuração do Quarto**\n\n- Crie um ambiente propício ao sono\n- Remova eletrônicos que perturbam o descanso\n- Mantenha roupas de exercício visíveis para a manhã seguinte\n\n**A Estação de Movimento**\n\n- Crie um espaço dedicado ao movimento em casa\n- Mantenha equipamentos acessíveis\n- Deixe tênis de caminhada perto da porta\n\n**O Princípio dos 20 Segundos**\n\nTorne hábitos saudáveis mais fáceis de iniciar (menos de 20 segundos de preparação) e hábitos não saudáveis mais difíceis. A conveniência determina o comportamento.",
            "keyTakeaways": [
                "Seu ambiente influencia poderosamente seu comportamento",
                "Torne as escolhas saudáveis visíveis e acessíveis",
                "Remova ou minimize as tentações do seu espaço"
            ],
            "actionStep": "Escolha uma área da sua casa para reorganizar hoje. Remova uma tentação e adicione um elemento que apoie seu bem-estar.",
            "journalPrimary": "Caminhe pela sua casa com um olhar renovado. Que mudanças no ambiente tornariam sua jornada de bem-estar mais fácil?"
        },
        5: {
            "introduction": "Ninguém tem sucesso sozinho. Hoje, vamos explorar como construir e nutrir uma rede de apoio para sua jornada de bem-estar.",
            "mainContent": "**O Poder da Comunidade**\n\nEstudos mostram consistentemente que pessoas com redes de apoio fortes têm mais sucesso em manter mudanças no estilo de vida. Seu círculo de apoio se torna sua rede de segurança e sua fonte de motivação.\n\n**Tipos de Apoio**\n\n- **Apoio Emocional**: Pessoas que ouvem e incentivam\n- **Apoio Prático**: Parceiros de treino, companheiros de preparo de refeições\n- **Apoio Informativo**: Mentores, coaches, profissionais de saúde\n- **Apoio de Responsabilidade**: Pessoas que checam seu progresso\n\n**Construindo Sua Rede**\n\n1. Identifique quem já está na sua rede\n2. Comunique suas metas com clareza\n3. Peça tipos específicos de apoio\n4. Ofereça apoio em troca\n5. Participe de comunidades que compartilhem seus valores\n\n**Lidando com Resistência**\n\nNem todos entenderão sua jornada. Algumas pessoas podem se sentir ameaçadas por suas mudanças. Lembre-se:\n- Você não precisa da aprovação de todos\n- Ações falam mais que palavras\n- Encontre sua tribo — mesmo que seja online\n- Mantenha o foco no seu 'porquê'",
            "keyTakeaways": [
                "Redes de apoio aumentam significativamente o sucesso em mudanças de estilo de vida",
                "Diferentes tipos de apoio atendem diferentes necessidades",
                "Você não precisa da aprovação de todos — encontre a sua tribo"
            ],
            "actionStep": "Hoje, entre em contato com uma pessoa que pode apoiar sua jornada de bem-estar. Compartilhe seus objetivos e pergunte se ela gostaria de trocar ideias com você regularmente.",
            "journalPrimary": "Quem na sua vida poderia apoiar sua jornada de bem-estar? Que tipo de apoio seria mais útil de cada pessoa?"
        },
        6: {
            "introduction": "Hoje, vamos descobrir o equilíbrio fundamental do bem-estar: nutrição e movimento trabalhando juntos.",
            "mainContent": "**Entendendo o Princípio 70/30**\n\nQuando se trata de composição corporal e bem-estar, pesquisas sugerem que aproximadamente 70% dos resultados vêm do que você come, enquanto 30% vêm da atividade física.\n\n**Por Que a Nutrição Lidera**\n\n- É muito mais fácil não comer 500 calorias do que queimá-las\n- Uma hora de exercício pode ser anulada por alguns minutos de alimentação descuidada\n- A qualidade dos alimentos afeta energia, humor e sono\n\n**Por Que o Movimento é Essencial**\n\n- Constrói e mantém massa muscular\n- Aumenta o metabolismo de repouso\n- Melhora a saúde mental e o humor\n- Fortalece ossos e articulações\n- Melhora a qualidade do sono\n- Reduz o risco de doenças crônicas\n\n**Encontrando o Equilíbrio**\n\nO melhor plano de bem-estar combina os dois:\n- Nutrição consciente para resultados de composição corporal\n- Movimento regular para saúde geral e vitalidade\n- Nenhum dos dois sozinho é suficiente\n- Juntos, eles criam bem-estar sustentável",
            "keyTakeaways": [
                "Aproximadamente 70% dos resultados de bem-estar vêm da nutrição",
                "O movimento responde por cerca de 30% e ainda é essencial",
                "O equilíbrio entre os dois cria bem-estar sustentável"
            ],
            "actionStep": "Reflita sobre seu equilíbrio atual. Você está dando ênfase demais a uma área? Hoje, comprometa-se a dar atenção igual tanto à nutrição quanto ao movimento.",
            "journalPrimary": "Onde você tem concentrado mais seus esforços de bem-estar — nutrição ou movimento? Como você poderia criar um equilíbrio melhor?"
        },
        7: {
            "introduction": "A fibra é um dos nutrientes mais subestimados. Hoje, vamos descobrir como essa aliada poderosa apoia seu bem-estar.",
            "mainContent": "**Dois Tipos de Fibra**\n\n**Fibra Solúvel**\n- Dissolve-se em água formando uma substância gelatinosa\n- Ajuda a reduzir o colesterol e regular o açúcar no sangue\n- Encontrada em: aveia, feijão, maçãs, frutas cítricas, cenouras\n\n**Fibra Insolúvel**\n- Não se dissolve em água\n- Adiciona volume às fezes e promove a regularidade\n- Encontrada em: vegetais, grãos integrais, nozes\n\n**Por Que a Fibra é Sua Amiga no Bem-Estar**\n\n- **Saciedade**: A fibra te mantém satisfeita por mais tempo\n- **Açúcar no Sangue**: Retarda a absorção de açúcar, prevenindo picos\n- **Saúde Digestiva**: Promove a regularidade e nutre bactérias intestinais benéficas\n- **Saúde do Coração**: Reduz os níveis de colesterol\n\n**Fontes de Fibra**\n\n- Feijões e lentilhas (campeões de fibra!)\n- Vegetais (brócolis, couve-de-bruxelas)\n- Frutas (com casca quando possível)\n- Grãos integrais (aveia, quinoa, arroz integral)\n- Nozes e sementes\n\n**Dicas Práticas**\n\n- Aumente a fibra gradualmente para evitar desconforto\n- Beba bastante água com alimentos ricos em fibra\n- Tente consumir de 25 a 30 gramas por dia",
            "keyTakeaways": [
                "A fibra solúvel (aveia, feijão) ajuda no açúcar no sangue e colesterol",
                "A fibra insolúvel (vegetais, grãos integrais) apoia a digestão",
                "Tente consumir 25-30 gramas por dia, aumentando gradualmente"
            ],
            "actionStep": "Adicione um alimento rico em fibra a cada refeição hoje. Escolha entre: vegetais, frutas com casca, feijões, aveia ou grãos integrais.",
            "journalPrimary": "Como sua digestão costuma funcionar? Quais alimentos ricos em fibra você gosta, e quais gostaria de experimentar?"
        },
        8: {
            "introduction": "A proteína é o bloco de construção do seu corpo. Hoje, vamos explorar como a proteína adequada apoia sua jornada de bem-estar.",
            "mainContent": "**Por Que a Proteína Importa**\n\n- **Saciedade**: A proteína é o macronutriente mais saciante\n- **Metabolismo**: Seu corpo gasta mais calorias digerindo proteína\n- **Manutenção Muscular**: Essencial para manter a massa muscular magra\n- **Reparo**: Seu corpo usa proteína para reparar tecidos e células\n\n**Quanta Proteína?**\n\nRecomendação geral: 0,8 a 1g por quilo de peso corporal\n- Pessoas ativas podem precisar de mais\n- Distribua ao longo do dia para melhor absorção\n\n**Fontes de Proteína**\n\n**Fontes Animais:**\n- Peito de frango/peru\n- Peixe e frutos do mar\n- Ovos\n- Iogurte grego\n- Queijo cottage\n\n**Fontes Vegetais:**\n- Feijões e lentilhas\n- Tofu e tempeh\n- Quinoa\n- Nozes e sementes\n- Edamame\n\n**Dicas para Proteína**\n\n- Inclua proteína em todas as refeições e lanches\n- Prepare fontes de proteína com antecedência\n- Misture fontes animais e vegetais para variedade\n- Considere um shake de proteína quando estiver com pouco tempo",
            "keyTakeaways": [
                "A proteína é o macronutriente mais saciante",
                "Inclua proteína em todas as refeições para energia equilibrada",
                "Tanto fontes animais quanto vegetais fornecem excelente proteína"
            ],
            "actionStep": "Inclua uma fonte de proteína em cada refeição hoje. Observe como sua fome e níveis de energia se comparam com dias normais.",
            "journalPrimary": "Quais são suas fontes favoritas de proteína? Existem novas opções que você gostaria de incorporar?"
        },
        9: {
            "introduction": "Os carboidratos foram injustamente demonizados. Hoje, vamos aprender a escolher carboidratos com sabedoria para energia sustentada.",
            "mainContent": "**Entendendo os Carboidratos**\n\nOs carboidratos são a fonte de energia preferida do seu corpo. O segredo é escolher os tipos certos.\n\n**Carboidratos Simples vs. Complexos**\n\n**Carboidratos Simples** (energia rápida, queda rápida):\n- Açúcar branco e doces\n- Pão branco e massas refinadas\n- Refrigerantes e sucos processados\n- A maioria dos alimentos processados\n\n**Carboidratos Complexos** (energia sustentada):\n- Grãos integrais (aveia, arroz integral, quinoa)\n- Batata-doce e tubérculos\n- Feijões e lentilhas\n- Vegetais\n- Frutas inteiras\n\n**Índice Glicêmico**\n\nO índice glicêmico (IG) mede quão rápido um alimento eleva o açúcar no sangue:\n- **IG Baixo** (abaixo de 55): Liberação lenta e constante de energia\n- **IG Médio** (56-69): Energia moderada\n- **IG Alto** (acima de 70): Pico rápido, seguido de queda\n\n**Dicas Práticas**\n\n- Escolha grãos integrais em vez de refinados\n- Combine carboidratos com proteína ou gordura para retardar a absorção\n- Coma frutas inteiras em vez de sucos\n- Preste atenção em como diferentes carboidratos afetam sua energia",
            "keyTakeaways": [
                "Carboidratos complexos fornecem energia sustentada",
                "Escolha alimentos com baixo índice glicêmico quando possível",
                "A fibra ajuda a moderar a resposta do açúcar no sangue"
            ],
            "actionStep": "Substitua um carboidrato refinado do seu dia por uma alternativa integral ou vegetal.",
            "journalPrimary": "Como você se sente depois de comer carboidratos simples versus complexos? Que padrões você percebe?"
        },
        10: {
            "introduction": "Gordura não engorda — as gorduras certas são essenciais para a saúde. Hoje, vamos aprender a abraçar as gorduras benéficas.",
            "mainContent": "**Gorduras São Essenciais**\n\nSeu corpo precisa de gordura para:\n- Produção de hormônios\n- Função cerebral (seu cérebro é 60% gordura!)\n- Absorção de nutrientes (vitaminas A, D, E, K)\n- Saciedade e satisfação\n\n**Gorduras Boas para Abraçar**\n\n**Gorduras Monoinsaturadas:**\n- Azeite de oliva\n- Abacate\n- Amêndoas e castanhas\n\n**Gorduras Poli-insaturadas (Ômega-3):**\n- Salmão e peixes gordurosos\n- Linhaça e chia\n- Nozes\n\n**Gorduras para Limitar**\n\n**Gorduras Saturadas** (com moderação):\n- Manteiga\n- Queijo\n- Carnes gordurosas\n\n**Gorduras Trans** (evitar completamente):\n- Alimentos processados\n- Margarina hidrogenada\n- Frituras comerciais\n\n**Dicas Práticas**\n\n- Use azeite como gordura principal para cozinhar\n- Adicione abacate a saladas e sanduíches\n- Coma um punhado de castanhas como lanche\n- Inclua peixe gordo 2-3 vezes por semana\n- Leia rótulos para evitar gorduras trans",
            "keyTakeaways": [
                "Gorduras saudáveis são essenciais para hormônios, cérebro e absorção de nutrientes",
                "Abraçe azeite, abacate, castanhas e peixes gordurosos",
                "Evite gorduras trans completamente; modere as gorduras saturadas"
            ],
            "actionStep": "Inclua uma fonte de gordura saudável em cada refeição hoje: abacate, azeite, castanhas ou peixe gordo.",
            "journalPrimary": "Quais gorduras saudáveis você já aprecia? Quais gostaria de adicionar à sua rotina?"
        },
        11: {
            "introduction": "Algo tão simples como a forma que mastigamos pode transformar nossa relação com a comida e melhorar a digestão.",
            "mainContent": "**Por Que Mastigar Importa**\n\nA digestão começa na boca, não no estômago. Mastigar adequadamente:\n- Libera enzimas digestivas na saliva\n- Quebra os alimentos para melhor absorção de nutrientes\n- Envia sinais de saciedade ao cérebro\n- Reduz o desconforto digestivo\n\n**A Prática das 30 Mastigadas**\n\nTente mastigar cada pedaço aproximadamente 30 vezes. Pode parecer excessivo no início, mas observe:\n- O alimento se torna líquido antes de engolir\n- Você sente mais sabores\n- Você se sente satisfeita mais cedo\n- Inchaço e desconforto diminuem\n\n**Benefícios da Mastigação Consciente**\n\n- **Melhor digestão**: Menos trabalho para o estômago\n- **Maior satisfação**: Você saboreia completamente sua comida\n- **Controle natural de porções**: Comer mais devagar dá tempo para os sinais de saciedade chegarem ao cérebro\n- **Menos desejos**: Experimentar plenamente o alimento satisfaz os desejos\n\n**Tornando um Hábito**\n\n- Coloque o garfo na mesa entre as mordidas\n- Faça porções menores\n- Concentre-se nas texturas e sabores\n- Desligue as distrações durante as refeições",
            "keyTakeaways": [
                "Mastigar 30 vezes por mordida melhora a digestão e a satisfação",
                "A digestão começa na boca com as enzimas da saliva",
                "Comer mais devagar reduz naturalmente o tamanho das porções"
            ],
            "actionStep": "Na sua próxima refeição, conte suas mastigadas nas cinco primeiras mordidas. Tente mastigar 30 vezes por mordida e perceba a diferença.",
            "journalPrimary": "Quão rápido você costuma comer? O que percebe quando desacelera e mastiga bem?"
        },
        12: {
            "introduction": "Consciência das porções não é sobre restrição — é sobre sintonizar com o que seu corpo realmente precisa.",
            "mainContent": "**O Problema das Porções**\n\nNos últimos 50 anos, o tamanho das porções aumentou drasticamente. O que consideramos 'normal' costuma ser 2-3 vezes maior do que nosso corpo precisa.\n\n**Guias Visuais de Porção**\n\nUse sua mão como guia:\n- **Proteína**: Palma da sua mão (espessura e tamanho)\n- **Vegetais**: Duas mãos em concha\n- **Carboidratos**: Uma mão em concha\n- **Gorduras**: Seu polegar (óleos, manteiga, pasta de amendoim)\n\n**O Método do Prato**\n\nMonte seu prato:\n- **Metade**: Vegetais não amiláceos\n- **Um quarto**: Proteína magra\n- **Um quarto**: Carboidratos complexos\n- **Mais**: Uma pequena quantidade de gordura saudável\n\n**Dicas de Porcionamento Consciente**\n\n- Use pratos menores (25 cm em vez de 30 cm)\n- Sirva a comida na cozinha, não na mesa estilo buffet\n- Espere 15-20 minutos antes de repetir\n- Ouça o sinal de 'satisfeita, mas não estufada'\n\n**Não é Sobre Perfeição**\n\nAlgumas refeições serão maiores, outras menores. O objetivo é consciência, não restrição.",
            "keyTakeaways": [
                "Sua mão fornece guias naturais de porção",
                "O método do prato: metade vegetais, um quarto proteína, um quarto carboidratos",
                "Busque 'satisfeita, mas não estufada'"
            ],
            "actionStep": "Use o método do prato em uma refeição hoje. Observe como se sente depois de comer — busque uma satisfação confortável.",
            "journalPrimary": "Como você costuma decidir quanto comer? Que sinais indicam que você comeu o suficiente?"
        },
        13: {
            "introduction": "Entender a densidade calórica ajuda você a comer porções satisfatórias enquanto apoia seus objetivos de bem-estar.",
            "mainContent": "**O Que É Densidade Calórica?**\n\nDensidade calórica mede quantas calorias estão concentradas em um determinado peso ou volume de alimento.\n\n**A Comparação**\n\nPelas mesmas 536 calorias, você poderia comer:\n- 100g de batata chips, OU\n- 224g de peito de frango, OU\n- 438g de arroz integral, OU\n- 1000g de brócolis, OU\n- 1624g de morangos\n\n**Por Que Isso Importa**\n\nAlimentos de baixa densidade calórica:\n- Enchem seu estômago com menos calorias\n- Fornecem mais nutrientes\n- Permitem porções maiores\n- Apoiam a saciedade natural\n\n**Alimentos de Baixa Densidade Calórica**\n- A maioria dos vegetais\n- A maioria das frutas\n- Sopas à base de caldo\n- Proteínas magras\n- Grãos integrais\n\n**Alimentos de Alta Densidade Calórica**\n- Chips e biscoitos salgados\n- Frituras\n- Doces e sobremesas\n- Óleos e manteiga\n- Castanhas (saudáveis, mas densas)\n\n**Aplicação Prática**\n\nComece as refeições com alimentos de baixa densidade (salada, sopa, vegetais). Isso naturalmente te satisfaz antes dos alimentos mais densos chegarem.",
            "keyTakeaways": [
                "Alimentos de baixa densidade calórica te saciam com menos calorias",
                "Comece as refeições com vegetais ou sopa à base de caldo",
                "O volume importa — você pode comer MAIS dos alimentos certos"
            ],
            "actionStep": "Comece sua maior refeição de hoje com uma salada grande ou uma tigela de sopa de legumes antes do prato principal.",
            "journalPrimary": "Quais alimentos de baixa densidade calórica você gosta? Como poderia incorporar mais deles?"
        },
        14: {
            "introduction": "Nem todas as calorias são iguais. Hoje, vamos aprender a escolher alimentos que realmente nutrem.",
            "mainContent": "**Calorias Vazias**\n\nCalorias vazias fornecem energia, mas pouco ou nenhum valor nutricional:\n- Refrigerantes e bebidas adoçadas\n- Balas e a maioria das sobremesas\n- Pão branco e grãos refinados\n- Frituras\n- Álcool\n\n**Alimentos Ricos em Nutrientes**\n\nAlimentos ricos em nutrientes concentram vitaminas, minerais e outros compostos benéficos por caloria:\n\n**Vegetais:**\n- Couve, espinafre, brócolis\n- Pimentões, cenouras\n- Tomates, cebolas, alho\n\n**Frutas:**\n- Frutas vermelhas (mirtilo, morango)\n- Frutas cítricas\n- Maçãs e peras\n\n**Proteínas:**\n- Salmão selvagem\n- Ovos\n- Leguminosas\n\n**Grãos Integrais:**\n- Quinoa\n- Aveia\n- Arroz integral\n\n**A Estratégia da Troca**\n\nEm vez de eliminar alimentos, foque em trocar:\n- Refrigerante → Água com gás e limão\n- Chips → Vegetais com homus\n- Pão branco → Pão integral\n- Balas → Frutas frescas\n\nPequenas trocas somam grandes mudanças ao longo do tempo.",
            "keyTakeaways": [
                "Calorias vazias fornecem energia sem nutrição",
                "Alimentos ricos em nutrientes nutrem cada célula do seu corpo",
                "Foque em trocar em vez de eliminar"
            ],
            "actionStep": "Identifique um alimento de calorias vazias que você consome regularmente. Encontre uma troca rica em nutrientes e experimente hoje.",
            "journalPrimary": "Quais alimentos de calorias vazias são mais difíceis de deixar? Que alternativas ricas em nutrientes poderiam satisfazer o mesmo desejo?"
        },
        15: {
            "introduction": "Onde e como você come afeta profundamente quanto come e quão satisfeita se sente.",
            "mainContent": "**O Efeito do Ambiente**\n\nPesquisas mostram que comemos mais quando:\n- Distraídos por telas\n- De pé ou com pressa\n- Comendo de pratos ou embalagens grandes\n- Em ambientes claros e barulhentos\n- Cercados por outros que comem mais\n\n**Criando um Espaço de Alimentação Consciente**\n\n**O Cenário Ideal:**\n- Sente-se à mesa\n- Use pratos e talheres de verdade\n- Elimine as telas\n- Iluminação suave e atmosfera calma\n- Boa companhia (ou solidão tranquila)\n\n**Dicas Práticas:**\n- Defina um espaço para comer em casa\n- Arrume a mesa, mesmo para refeições simples\n- Reserve pelo menos 15 minutos para cada refeição\n- Coloque o celular em outro cômodo\n- Acenda uma vela para sinalizar 'hora da refeição'\n\n**O Elemento Social**\n\nComer com outros pode ser maravilhoso, mas fique atenta:\n- Tendemos a espelhar o ritmo de alimentação dos outros\n- Refeições em grupos grandes costumam significar porções maiores\n- Escolha companhias que apoiem seus objetivos\n\n**Transformando Refeições em Ritual**\n\nQuando elevamos o ato de comer de 'abastecer' para 'ritual', naturalmente comemos com mais atenção e satisfação.",
            "keyTakeaways": [
                "Seu ambiente alimentar influencia o tamanho das porções e a satisfação",
                "Elimine distrações — especialmente telas — durante as refeições",
                "Crie rituais na hora da refeição para comer com mais consciência"
            ],
            "actionStep": "Transforme uma refeição de hoje em um ritual consciente: arrume a mesa, elimine as telas e coma devagar com atenção.",
            "journalPrimary": "Onde você costuma comer? Como seu ambiente afeta sua experiência alimentar?"
        },
        16: {
            "introduction": "Como você começa seu dia define o tom de tudo que vem depois. Hoje, vamos planejar a nutrição matinal ideal.",
            "mainContent": "**A Importância do Café da Manhã**\n\nQuebrar o jejum noturno com cuidado:\n- Dá a partida no seu metabolismo\n- Estabiliza o açúcar no sangue\n- Previne quedas de energia no meio da manhã\n- Reduz a probabilidade de comer demais depois\n\n**A Fórmula do Café da Manhã Equilibrado**\n\n**Proteína (Essencial):**\n- Ovos (de qualquer jeito)\n- Iogurte grego\n- Queijo cottage\n- Pasta de amendoim\n\n**Carboidratos Complexos:**\n- Aveia\n- Pão integral\n- Frutas frescas\n\n**Gorduras Saudáveis:**\n- Abacate\n- Castanhas e sementes\n- Azeite de oliva\n\n**Ideias de Café da Manhã**\n\n1. Aveia com frutas vermelhas, castanhas e um fio de mel\n2. Parfait de iogurte grego com frutas e granola\n3. Ovos com abacate no pão integral\n4. Vitamina com espinafre, banana, proteína em pó e pasta de amendoim\n\n**Se Você Não Sente Fome de Manhã**\n\nComece pequeno:\n- Um punhado de castanhas\n- Uma fruta com pasta de amendoim\n- Uma vitamina pequena\n\nSua fome pela manhã muitas vezes reflete como você comeu na noite anterior.",
            "keyTakeaways": [
                "Um café da manhã equilibrado inclui proteína, carboidratos complexos e gordura saudável",
                "A proteína é essencial para energia sustentada pela manhã",
                "Sem fome? Comece pequeno e ajuste sua alimentação noturna"
            ],
            "actionStep": "Planeje e prepare um café da manhã equilibrado para amanhã com os três componentes: proteína, carboidratos e gordura.",
            "journalPrimary": "Como é sua manhã típica? Como um café da manhã nutritivo poderia mudar seu dia?"
        },
        17: {
            "introduction": "O almoço é sua parada de reabastecimento no meio do dia. Hoje, vamos montar refeições que te sustentam pela tarde toda.",
            "mainContent": "**A Queda da Tarde**\n\nMuitas pessoas experimentam a queda de energia das 14-15h. Geralmente, isso acontece por:\n- Um almoço com carboidratos simples demais\n- Um almoço pequeno demais ou pulado\n- Hidratação insuficiente\n\n**Montando um Almoço Melhor**\n\n**Base de Proteína:**\n- Frango ou peixe grelhado\n- Ovos cozidos\n- Feijão ou lentilhas\n- Tofu ou tempeh\n\n**Volume de Vegetais:**\n- Base de folhas verdes\n- Vegetais coloridos\n- Opções cruas ou assadas\n\n**Leguminosas e Grãos:**\n- Grão-de-bico\n- Quinoa\n- Arroz integral\n- Lentilhas\n\n**Ideias de Almoço**\n\n1. Salada grande com frango grelhado, grão-de-bico, vegetais e molho de azeite\n2. Bowl com quinoa, vegetais assados e tahine\n3. Sopa de legumes com pão integral e queijo\n4. Wraps de alface com carne moída de peru e vegetais\n\n**Dicas Práticas**\n\n- Prepare marmitas no domingo\n- Faça porções extras do jantar para o almoço do dia seguinte\n- Tenha opções saudáveis congeladas para emergências\n- Coma longe da sua mesa de trabalho quando possível",
            "keyTakeaways": [
                "Um almoço rico em proteínas previne quedas de energia à tarde",
                "Preencha metade do seu prato de almoço com vegetais",
                "Preparar refeições com antecedência torna almoços saudáveis sustentáveis"
            ],
            "actionStep": "Planeje o almoço de amanhã esta noite. Inclua proteína, muitos vegetais e um carboidrato complexo.",
            "journalPrimary": "Como sua energia da tarde se compara com a da manhã? Como seu almoço pode estar influenciando isso?"
        },
        18: {
            "introduction": "O jantar encerra seu dia de nutrição. Hoje, vamos criar refeições noturnas que nutrem sem pesar.",
            "mainContent": "**O Equilíbrio do Jantar**\n\nO jantar é frequentemente a maior refeição, mas deveria ser a mais leve. À noite, seu corpo está se preparando para descansar, não para atividades intensas.\n\n**Princípios do Jantar**\n\n- Coma pelo menos 2-3 horas antes de dormir\n- Priorize proteínas e vegetais\n- Reduza carboidratos densos à noite\n- Mantenha as porções moderadas\n\n**Ideias de Jantar Leve**\n\n1. Peixe grelhado com vegetais assados\n2. Salada grande com proteína e abacate\n3. Sopa de legumes com frango desfiado\n4. Omelete de vegetais com salada\n5. Frango grelhado com legumes no vapor\n\n**O Desafio do Lanche Noturno**\n\nComer tarde da noite costuma ser emocional, não por fome:\n- Tédio após o jantar\n- Hábito de beliscar assistindo TV\n- Estresse do dia não processado\n\n**Estratégias para a Noite**\n\n- Escove os dentes após o jantar (sinal de 'cozinha fechada')\n- Prepare um chá calmante\n- Se sentir fome real, escolha algo leve com proteína\n- Identifique se é fome verdadeira ou emocional",
            "keyTakeaways": [
                "O jantar deve ser a refeição mais leve do dia",
                "Coma pelo menos 2-3 horas antes de dormir",
                "Lanches noturnos costumam ser emocionais — identifique a causa real"
            ],
            "actionStep": "Hoje, jante mais cedo do que o habitual e faça uma refeição leve focada em proteínas e vegetais.",
            "journalPrimary": "Quais são seus hábitos noturnos de alimentação? Você come por fome real ou por outros motivos?"
        },
        19: {
            "introduction": "Lanches inteligentes podem ser seus aliados no bem-estar. Hoje, vamos aprender a lanchar de forma que apoie seus objetivos.",
            "mainContent": "**Lanches com Propósito**\n\nLanches não são o inimigo — lanches sem planejamento são. Um lanche estratégico pode:\n- Manter o açúcar no sangue estável\n- Prevenir fome excessiva nas refeições principais\n- Fornecer nutrientes extras\n- Sustentar a energia ao longo do dia\n\n**A Fórmula do Lanche Inteligente**\n\nCombine dois componentes:\n- **Proteína ou gordura saudável** (para saciedade)\n- **Fibra** (para sustentação)\n\n**Exemplos de Lanches Inteligentes**\n\n- Maçã com pasta de amendoim\n- Cenouras com homus\n- Iogurte grego com frutas vermelhas\n- Castanhas com uma fruta\n- Queijo com uvas\n- Ovos cozidos com palitos de pepino\n\n**Lanches para Evitar**\n\n- Bolachas e biscoitos refinados\n- Barras de cereal com muito açúcar\n- Salgadinhos e chips\n- Doces e balas\n- Bebidas açucaradas\n\n**Dicas de Planejamento**\n\n- Prepare lanches no início da semana\n- Tenha opções saudáveis sempre à mão\n- Porções pré-definidas evitam excessos\n- Coma lanches sentada e com atenção, não de pé ou distraída",
            "keyTakeaways": [
                "Lanches estratégicos mantêm a energia e o açúcar no sangue estáveis",
                "Combine proteína/gordura com fibra para saciedade duradoura",
                "Planejamento é a chave — tenha opções saudáveis sempre à mão"
            ],
            "actionStep": "Prepare três opções de lanches saudáveis hoje para ter disponíveis durante a semana.",
            "journalPrimary": "Quando você costuma sentir mais vontade de beliscar? Que lanches saudáveis poderiam satisfazer esse momento?"
        },
        20: {
            "introduction": "Ler rótulos de alimentos é uma habilidade poderosa. Hoje, vamos aprender a decifrar o que realmente está na sua comida.",
            "mainContent": "**Decifrando os Rótulos**\n\nRótulos de alimentos podem ser confusos, mas com algumas dicas, você se torna uma consumidora informada.\n\n**O Que Observar Primeiro**\n\n1. **Tamanho da porção**: Tudo se baseia nisso\n2. **Lista de ingredientes**: Quanto menos, melhor. Ingredientes aparecem em ordem decrescente de quantidade\n3. **Açúcar adicionado**: Procure por nomes disfarçados (xarope, dextrose, maltose)\n4. **Fibra**: Quanto mais, melhor\n5. **Sódio**: Menos de 600mg por porção é ideal\n\n**Nomes Disfarçados do Açúcar**\n\n- Xarope de milho / xarope de frutose\n- Dextrose, maltose, sacarose\n- Suco de fruta concentrado\n- Mel e melaço (ainda são açúcar)\n- Néctar de agave\n\n**Truques de Marketing para Reconhecer**\n\n- \"Natural\" não significa saudável\n- \"Light\" pode significar menos de algo, mas mais de outro\n- \"Sem gordura\" muitas vezes significa mais açúcar\n- \"Integral\" verifique se é o primeiro ingrediente\n- \"Sem açúcar adicionado\" pode ter açúcar natural alto\n\n**Regra Prática**\n\nSe a lista de ingredientes é mais longa que sua lista de compras, provavelmente é ultraprocessado. Prefira alimentos com poucos ingredientes que você reconheça.",
            "keyTakeaways": [
                "Sempre verifique o tamanho da porção antes de qualquer outra coisa",
                "Ingredientes são listados em ordem decrescente de quantidade",
                "Aprenda os nomes disfarçados do açúcar nos rótulos"
            ],
            "actionStep": "Na sua próxima ida ao mercado, leia os rótulos de três produtos que você compra regularmente. Compare-os com alternativas mais saudáveis.",
            "journalPrimary": "Você costuma ler rótulos de alimentos? O que te surpreendeu ao olhar com mais atenção?"
        },
    }

def apply_translations(data, translations):
    """Apply translations to lessons data."""
    count = 0
    for lesson in data['lessons']:
        day = lesson['dayNumber']
        if day in translations:
            t = translations[day]
            lesson['content']['introduction'] = t['introduction']
            lesson['content']['mainContent'] = t['mainContent']
            lesson['content']['keyTakeaways'] = t['keyTakeaways']
            lesson['content']['actionStep'] = t['actionStep']
            lesson['journalPrompt']['primary'] = t['journalPrimary']
            count += 1
    return count

if __name__ == '__main__':
    filepath = 'src/i18n/locales/pt/lessons.json'
    with open(filepath, 'r') as f:
        data = json.load(f)
    
    translations = get_translations()
    count = apply_translations(data, translations)
    
    with open(filepath, 'w') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"Applied {count} translations (Days 1-20)")
