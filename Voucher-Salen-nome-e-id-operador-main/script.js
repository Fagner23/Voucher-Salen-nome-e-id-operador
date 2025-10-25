const TICKET_TEMPLATE = `
<section style="width: 100%; max-width: 500px; background: #000; color: #fff; font-family: Arial, sans-serif; padding: 20px; border-radius: 8px; position: relative; margin: 0 auto;">
  
  <!-- Caixa branca com o número -->
  <div style="position: absolute; top: 20px; right: 20px; background: #fff; color: #000; border-radius: 8px; padding: 10px 15px; text-align: center; font-size: 14px; font-weight: bold;">
    <div style="font-size: 18px;">1</div>
    EXAME DE VISTA<br>
    <span style="color: orange;">GRATUITO</span>
  </div>

  <!-- Cabeçalho -->
  <h2 style="margin: 0; font-size: 18px; font-weight: bold;">COM ESTE VOUCHER:</h2>

  <p style="margin: 15px 0; font-size: 16px;">
    SEU <span style="color: orange; font-weight: bold;">EXAME DE VISTA</span> ESTÁ 
    <span style="color: orange; font-weight: bold;">GARANTIDO</span>
  </p>

  <!-- Dados -->
  <div style="margin-top: 20px; font-size: 15px; line-height: 1.8;">
    <p>Nome:<br><strong>{{name}}</strong></p>
    <p>Data:<br><strong>{{date}}</strong></p>
    <p>Horário:<br><strong>{{time}}</strong></p>
  </div>

  <!-- Rodapé -->
  <footer style="margin-top: 30px; font-size: 13px; text-align: center; color: #ccc;">
    Realize seu exame no endereço abaixo:<br>
    <strong>{{local}}</strong>
  </footer>
</section>`;

 
  ;
// --- Configuração Central de Acesso --- //
const KEY_PAGAMENTO_ATRASADO = "pagamentoAtrasado"; 
const CLASSE_ALERTA = 'acesso-alerta-modal';
const COR_ALERTA = "#e63946"; // Vermelho primário para bloqueio/urgência
const COR_SUCESSO = "#1d3557"; // Azul primário para notificação normal

let controleIntervalo = null; // Variável para o loop de monitoramento

// ---------------- FUNÇÕES AUXILIARES ----------------

/**
 * Escurece uma cor em hexadecimal (mantida do código anterior).
 */
function shadeColor(color, percent) {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return "#" + (
        0x1000000 +
        (R < 255 ? (R < 0 ? 0 : R) : 255) * 0x10000 +
        (G < 255 ? (G < 0 ? 0 : G) : 255) * 0x100 +
        (B < 255 ? (B < 0 ? 0 : B) : 255)
    ).toString(16).slice(1);
}

/**
 * Exibe um modal de notificação no canto inferior direito para o usuário.
 * Usamos 'data-dismiss' para um fechamento mais limpo.
 */
function mostrarNotificacao(mensagem, isUrgente = false) {
    // Se o modal urgente já estiver aberto, evite duplicidade (isUrgente é o padrão)
    if (document.querySelector(`.${CLASSE_ALERTA}[data-alerta-urgente='true']`)) return;

    const modal = document.createElement("div");
    modal.className = CLASSE_ALERTA;
    modal.setAttribute('data-alerta-urgente', isUrgente ? 'true' : 'false');
    modal.style = `
        position: fixed; bottom: 20px; right: 20px; max-width: 300px;
        background: #ffffff; padding: 15px; border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2); z-index: 999999;
        font-family: 'Inter', sans-serif; border-left: 5px solid ${isUrgente ? COR_ALERTA : COR_SUCESSO};
        animation: slideIn 0.5s forwards;
    `;

    const cor = isUrgente ? COR_ALERTA : COR_SUCESSO;

    modal.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
            <h4 style="color: ${cor}; font-size: 1rem; margin: 0;">
                ${isUrgente ? "🚨 AÇÃO REQUERIDA" : "✅ Status do Sistema"}
            </h4>
            <button onclick="this.closest('.${CLASSE_ALERTA}').remove()" 
                style="background: none; border: none; font-size: 1.2rem; cursor: pointer; color: #aaa; padding: 0;">
                &times;
            </button>
        </div>
        <p style="font-size: 0.9rem; color: #555; margin: 0; line-height: 1.4;">
            ${mensagem}
        </p>
    `;
    document.body.appendChild(modal);
    
    // Adiciona animação de entrada (necessita de CSS)
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes slideIn {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
        }
    `;
    document.head.appendChild(style);
}

/**
 * Bloqueia completamente o sistema com uma mensagem clara de suspensão.
 */
function bloquearSistemaPorPagamento() {
    // 1. Limpa o intervalo de checagem, pois o bloqueio é final
    if (controleIntervalo) {
        clearInterval(controleIntervalo);
        controleIntervalo = null;
    }

    // 2. Bloqueio total da tela com estilo
    document.body.innerHTML = `
        <div style="
            display: flex; flex-direction: column; align-items: center;
            justify-content: center; height: 100vh; background: ${COR_ALERTA};
            color: #ffffff; font-family: 'Inter', sans-serif; text-align: center;
            padding: 20px; animation: pulse 1s infinite alternate;
        ">
            <h1 style="font-size: 3rem; color: #fff; margin-bottom: 15px; border-bottom: 3px solid #fff;">
                ⚠️ SISTEMA SUSPENSO
            </h1>
            <h2 style="font-size: 1.8rem; margin-bottom: 30px;">
               Taxa de Manutenção em Atraso
            </h2>
            <p style="font-size: 1.3rem; margin-bottom: 40px; max-width: 700px; line-height: 1.5;">
                O seu acesso foi bloqueado. Por favor, entre em contato imediatamente com o setor financeiro 
                para reativar .
            </p>
            <a href="#" style="
                padding: 12px 30px; background: #fff; color: ${COR_ALERTA};
                border-radius: 8px; text-decoration: none; font-weight: 700;
                font-size: 1.1rem; box-shadow: 0 4px 10px rgba(0,0,0,0.3); 
            ">
                Falar com o Suporte 
            </a>
        </div>
        <style>
            @keyframes pulse {
                from { background-color: ${COR_ALERTA}; }
                to { background-color: ${shadeColor(COR_ALERTA, -15)}; }
            }
        </style>
    `;
}

// ---------------- FUNÇÃO PRINCIPAL ----------------

/**
 * Inicia o controle de acesso com foco exclusivo no status de pagamento.
 */
function iniciarControlePagamento() {
    const pagamentoAtrasado = localStorage.getItem(KEY_PAGAMENTO_ATRASADO) === 'true';

    // PRIORIDADE 1: Bloqueio Imediato
    if (pagamentoAtrasado) {
        bloquearSistemaPorPagamento();
        return;
    }

    // PRIORIDADE 2: Sistema Liberado, mas com Monitoramento Ativo
    
    // Inicia a checagem periódica (a cada 5 segundos) para reagir à mudança de status
    controleIntervalo = setInterval(() => {
        if (localStorage.getItem(KEY_PAGAMENTO_ATRASADO) === 'true') {
            // Se a chave for alterada para 'true' durante o uso, bloqueia imediatamente
            bloquearSistemaPorPagamento();
        }
    }, 5000);

    // Notifica o usuário que o sistema está em operação normal
    mostrarNotificacao("Seu acesso está ativo e regularizado", false);
}

// ---------------- INICIALIZAÇÃO ----------------

document.addEventListener("DOMContentLoaded", () => {
    // ** PONTO DE CONTROLE: Altere 'true' para 'false' para liberar o acesso. **
    localStorage.setItem(KEY_PAGAMENTO_ATRASADO, 'true'); // Simula o status de pagamento (true = atrasado, false = em dia)

    iniciarControlePagamento();
});

const ENDERECOS_BENETTI = [
  {
    bairro: "Itaquera",
    endereco: "R. Itagimirim, 80 - Jardim Cleide, São Paulo - SP, 08220-530",
    pontoReferencia: "Killer Bees/Proximo a antiga estação itaquera",
    horarioAlmoco: {
      inicio: "13:00",
      fim: "14:00",
    },
    expedienteSemana: {
      inicio: "10:00",
      fim: "16:30",
    },
    expedienteFimDeSemana: {
      inicio: "10:00",
      fim: "16:30",
    },
  },
  {
    bairro: "Ponte Rasa",
    endereco:
      "Av. São Miguel, 4603 - Jardim Cotinha, São Paulo - SP, 03871-100",
    pontoReferencia: "Banco Itaú/ Pernanbucanas",
    horarioAlmoco: {
      inicio: "13:00",
      fim: "14:00",
    },
    expedienteSemana: {
      inicio: "09:00",
      fim: "17:00",
    },
    expedienteFimDeSemana: {
      inicio: "10:00",
      fim: "16:30",
    },
  },
  {
    bairro: "São Miguel Paulista",
    endereco:
      "R. José Otoni , 82 - São Miguel Paulista, São Paulo - SP, 08010-290",
    pontoReferencia: "Ao lado do Mercado Municipal de São Miguel",
    horarioAlmoco: {
      inicio: "13:00",
      fim: "14:00",
    },
    expedienteSemana: {
      inicio: "09:00",
      fim: "17:00",
    },
    expedienteFimDeSemana: {
      inicio: "09:00",
      fim: "16:30",
    },
  },
];

const ENDERECOS_LELLI = [
  {
    bairro: "Artur Alvim",
    endereco:
      "R. Maria Eugênia Célso, 35 - Parque Artur Alvim, São Paulo - SP, 03568-050",
    pontoReferencia: "Ragazzo/Rua Do Metrô",
    horarioAlmoco: {
      inicio: "13:00",
      fim: "14:00",
    },
    expedienteSemana: {
      inicio: "11:15",
      fim: "17:30",
    },
    expedienteFimDeSemana: {
      inicio: "10:00",
      fim: "14:45",
    },
  },
  {
    bairro: "Vila Prudente",
    endereco:
      "Av. Professor Luiz Ignácio Anhaia Mello, 1190 - Q.ta da Paineira, São Paulo - SP, 03154-000",
    pontoReferencia:
      "Entre smart fit e burguer king",
      horarioAlmoco: {
        inicio: "12:00",
        fim: "13:00",
      },
   
    expedienteSemana: {
      inicio: "10:00",
      fim: "17:15",
    },
    expedienteFimDeSemana: {
      inicio: "09:00",
      fim: "15:00",
    },
  },
  
/*
  {
    bairro: "Vila Maria",
    endereco:
      "Av. das Cerejeiras, 1322 - Jardim Japão, São Paulo - SP, 02124-000",
    pontoReferencia: "Cacau Show/M Kids",
    horarioAlmoco: {
      inicio: "13:30",
      fim: "14:30",
    },
    expedienteSemana: {
      inicio: "10:00",
      fim: "18:00",
    },
    expedienteFimDeSemana: {
      inicio: "10:00",
      fim: "15:00",
    },
  },
  
  {
    bairro: "Ipiranga",
    endereco:
      "Rua Vergueiro, 6450 ",
    pontoReferencia: "3 minutos estação metrô alto do Ipiranga,esquina do Ragazzo",
    horarioAlmoco: {
      inicio: "13:00",
      fim: "14:00",
    },
    expedienteSemana: {
      inicio: "09:40",
      fim: "17:20",
    },
    expedienteFimDeSemana: {
      inicio: "10:00",
      fim: "15:00",
    },
  },

  {
    bairro: "São Caetano",
    endereco:
      "Rua Visconde de inhaúma , 207",
    pontoReferencia: " ao lado do ESPETINHO MIMI",
    horarioAlmoco: {
      inicio: "12:00",
      fim: "13:00",
    },
    expedienteSemana: {
      inicio: "09:30",
      fim: "16:30",
    },
    expedienteFimDeSemana: {
      inicio: "10:00",
      fim: "15:00",
    },
  },*/
 /* 
  {
    bairro: "Republica",
    endereco: "R. Marconi, 54 - República",
    pontoReferencia: "Entre a Rua 7 de Abril e Barão de Itapetininga",
    horarioAlmoco: null,
    expedienteSemana: {
      inicio: "10:40",
      fim: "16:00",
    },
    expedienteFimDeSemana: null,
  }, 
 
  {
    bairro: "Ipiranga",
    endereco: "Rua Vergueiro 6450 - Ipiranga",
    pontoReferencia: "50 m da estação alto do Ipiranga, próximo ao Ragazzo",
    
    expedienteSemana: {
      inicio: "10:00",
      fim: "16:30",
    },
    expedienteFimDeSemana: {
      inicio: "10:00",
      fim: "15:30",
    },
  }*/
    
      {
        bairro: "Mogi das Cruzes",
        endereco: "Rua Doutor Paulo Frontin, 15  CENTRO Complemento: Loja 2   CEP: 08710-050 ",
        pontoReferencia: "Ao lado da loja TAKARA, e perto da loja BESNI",
        horarioAlmoco: {
          inicio: "13:00",
          fim: "14:00",
        },
        expedienteSemana: {
          inicio: "09:00",
          fim: "18:45",
        },
    
      },

];

const ENDERECOS_PERCI = [
  {
    bairro: "Itaquaquecetuba",
    endereco: "R. Caxambú, 30 - Vila Zeferina,Itaquaquecetuba",
    pontoReferencia: "E.E Homero fernado Milano/ vest casa",
    horarioAlmoco: {
      inicio: "13:00",
      fim: "14:00",
    },
    expedienteSemana: {
      inicio: "09:00",
      fim: "17:00",
    },
    expedienteFimDeSemana: {
      inicio: "09:00",
      fim: "17:00",
    },
  },
  {
    bairro: "Santana",
    endereco: "Rua Alfredo Pujol, 118",
    pontoReferencia: "Na Rua Do Mc Donald's do quartel á 200m do Metrô Santana",
    horarioAlmoco: {
      inicio: "13:00",
      fim: "14:00",
    },
    expedienteSemana: {
      inicio: "09:00",
      fim: "17:00",
    },
    expedienteFimDeSemana: {
      inicio: "09:00",
      fim: "17:00",
    },
  },
];

const ENDERECOS_VENICE = [
  {
    bairro: "Mauá",
    endereco: "R. Ver. Ângelo Gianone, 41 C - Centro, Mauá - SP, 09390-070",
    pontoReferencia: "próximo ao Banco do Brasil e a loja de roupas SBX",
    horarioAlmoco: {
      inicio: "13:00",
      fim: "14:00",
    },
    expedienteSemana: {
      inicio: "09:00",
      fim: "18:00",
    },
    expedienteFimDeSemana: {
      inicio: "09:00",
      fim: "18:00",
    },
  },
  {
    bairro: "Cachoeirinha",
    endereco: "Av. Parada Pinto, 258 ",
    pontoReferencia: "Proximo da loja Marisa",
    
    expedienteSemana: {
      inicio: "09:00",
      fim: "19:00",
    },
    expedienteFimDeSemana: {
      inicio: "09:00",
      fim: "17:00",
    },
  },
];

const ENCERECOS_ZAFF = [
  {
    bairro: "Macaé",
    endereco: "Av. Rui Barbosa 305 Centro Macae RJ " ,
    pontoReferencia: "Próximo á Loja Competição / entre a Siticol e a Lojas Leader SAL ",
    horarioAlmoco: {
      inicio: "13:00",
      fim: "14:00",
    },
    expedienteSemana: {
      inicio: "09:20",
      fim: "16:40",
    },
    expedienteFimDeSemana: {
      inicio: "09:00",
      fim: "13:15",
    },
  },
  
  {
    bairro: "Cabo Frio",
    endereco: "R. Érico Coelho, 140 Centro, Cabo Frio - RJ",
    pontoReferencia: "No calçadão, ao  da loja ED+",
    horarioAlmoco: {
      inicio: "12:00",
      fim: "14:00",
    },
    expedienteSemana: {
      inicio: "09:00",
      fim: "17:00",
    },
    expedienteFimDeSemana: {
      inicio: "09:00",
      fim: "12:00",
    },
  },

];

const ENDERECOS_RAZA = [
  {
    bairro: "Campo De Goycatazes",
    endereco:
      " Av. Sete De Setembro, 486 - Centro - Campo De Goytacazes  RJ " ,
    pontoReferencia:
      " Caixa Econômica Federal",
    horarioAlmoco: {
      inicio: "12:00",
      fim: "13:30",
    },
    expedienteSemana: {
      inicio: "08:00",
      fim: "17:15",
    },
    expedienteFimDeSemana: {
      inicio: "08:00",
      fim: "13:00",
    },
  },

   {
    bairro: "São jose dos Campos/SP",
    endereco:
      " Av.Mal Floriano Peixoto, 188 - Centro - São José dos Campos - SP " ,
    pontoReferencia:
      "",
    horarioAlmoco: {
      inicio: "12:00",
      fim: "13:30",
    },
    expedienteSemana: {
      inicio: "09:00",
      fim: "17:00",
    },
    expedienteFimDeSemana: {
      inicio: "08:00",
      fim: "13:00",
    },
  },
/*
  {
    bairro: "Campo De Goycatazes 2",
    endereco:
      " Rua 13 de Maio, 36 - Campo De Goytacazes - RJ" ,
    pontoReferencia:
      "Em frente ao antigo Banco do Brasil ",
    horarioAlmoco: {
      inicio: "12:00",
      fim: "13:30",
    },
    expedienteSemana: {
      inicio: "08:45",
      fim: "17:45",
    },
    expedienteFimDeSemana: {
      inicio: "08:45",
      fim: "12:30",
    },
  },
*/

  {
    bairro: "Espirito Santo",
    endereco:
      "Av. Central, 440 - Parque Res. Laranjeiras Serra - ES, 29165-130",

    pontoReferencia:
      "Ao lado do Banco Benestes - Em frente à loja Simonett",
   
    expedienteSemana: {
      inicio: "09:00",
      fim: "17:00",
    },
    expedienteFimDeSemana: {
      inicio: "09:00",
      fim: "14:00",
    },
  },
  {
    bairro: "RIO DAS OSTRAS",
    endereco:
      "Rodovia Amaral Peixoto, 4472 Lojas A",

    pontoReferencia:
      "Em frente a Rodoviária da 1001",

    expedienteSemana: {
      inicio: "09:00",
      fim: "18:30",
    },
    expedienteFimDeSemana: {
      inicio: "09:00",
      fim: "14:00",
    },
  },

  {
    bairro: "Cariacica ",
    endereco:
      "Av. Expedito Garcia, 49 - Campo Grande, Cariacica - ES, 29020-290",

    pontoReferencia:
      "",

    expedienteSemana: {
      inicio: "09:00",
      fim: "17:00",
    },
    expedienteFimDeSemana: {
      inicio: "09:00",
      fim: "14:00",
    },
  },

  {
    bairro: "RAZA BH ",
    endereco:
      "Av. Paraná, 170 - Centro - BH",

    pontoReferencia:
      "",

    expedienteSemana: {
      inicio: "09:00",
      fim: "17:00",
    },
    expedienteFimDeSemana: {
      inicio: "09:00",
      fim: "14:00",
    },
  },

   {
    bairro: "juíz de fora ",
    endereco:
      "Av Barão do Rio Branco, 2360 - Loja 2 Centro, (segundo piso) ",

    pontoReferencia:
      "ao lado do banco da caixa economica federal",

    expedienteSemana: {
      inicio: "08:30",
      fim: "17:00",
    },
    expedienteFimDeSemana: {
      inicio: "09:00",
      fim: "14:00",
    },
  },
];
const ENDERECOS_MIDAS = [
  {
    bairro: "Bangu",
    endereco: "R Silva Cardoso 21c - Bangu - RJ , 21810-032 ",
    pontoReferencia: " Fica em frente ao ponto final do onibus 864",
    horarioAlmoco: {
      inicio: "12:00",
      fim: "13:00",
    },
    expedienteSemana: {
      inicio: "09:00",
      fim: "17:00",
    },
    expedienteFimDeSemana: {
      inicio: "09:00",
      fim: "15:00",
    },
  },
];

const ENDERECOS_STILE = [
  /*{
    bairro: "São Vicente",
    endereco: "R. João Ramalho. 864 - Centro - 11310-050 , São Vicente",
    pontoReferencia: " 1°DP  de São Vicente/Skina Modas",
    horarioAlmoco: {
      inicio: "13:00",
      fim: "14:00",
    },
    expedienteSemana: {
      inicio: "09:30",
      fim: "18:00",
    },
    expedienteFimDeSemana: {
      inicio: "10:00",
      fim: "16:00",
    },
  },

  {
    bairro: "Praia Grande",
    endereco:
      "R. Oswaldo de Oliveira 192 - Boqueirão -11701-120 , Praia Grande",
    pontoReferencia: " Av São Paulo eTech Mundo Eletronicoss",
    horarioAlmoco: {
      inicio: "13:00",
      fim: "14:00",
    },
    expedienteSemana: {
      inicio: "09:30",
      fim: "18:00",
    },
    expedienteFimDeSemana: {
      inicio: "10:00",
      fim: "16:00",
    },
  },
];*/

  {
    bairro: "Campinas",
    endereco: "Av.Francisco Glicério, 1103 - Centro Campinas",
    pontoReferencia: " Ao lado do Magazine Luiza",
    horarioAlmoco: {
      inicio: "13:00",
      fim: "14:00",
    },
    expedienteSemana: {
      inicio: "09:00",
      fim: "17:00",
    },
    expedienteFimDeSemana: {
      inicio: "09:00",
      fim: "15:00",
    },
  },

  {
    bairro: "Santos",
    endereco: "Av.Ana costa ,185 - Gonzaga, Santos - SP",
    pontoReferencia: " Antigo Santander, Proximo a Maternidade São Lucas ",
    horarioAlmoco: {
      inicio: "13:00",
      fim: "14:00",
    },
    expedienteSemana: {
      inicio: "09:00",
      fim: "17:40",
    },
    expedienteFimDeSemana: {
      inicio: "09:00",
      fim: "15:50",
    },
  },
];

/*
const ENDERECOS_2_IRMAOS = [
  {
    bairro: "Praça 8",
    endereco:
      "Rua Santo Antônio do aventureiro, 151, Jardim Kawamoto  Guarulhos - 071443-040",
    pontoReferencia: "Proximo ao mercado Barbosa da praça 8",
    horarioAlmoco: null,
    expedienteSemana: {
      inicio: "10:00",
      fim: "15:00",
    },
    expedienteFimDeSemana: {
      inicio: "10:00",
      fim: "12:20",
    },
  },

  {
    bairro: "Ponte Alta",
    endereco: "Avenida Rangel Filho, 1417- Ponte alta, Guarulhos- SP, 07179350",
    pontoReferencia: "Proxímo ao mercado X",
    horarioAlmoco: null,
    expedienteSemana: {
      inicio: "10:00",
      fim: "15:00",
    },
    expedienteFimDeSemana: {
      inicio: "10:00",
      fim: "15:00",
    },
  },
];
*/
const ENDERECOS_Smart_New = [
  {
    bairro: "Itaquaquecetuba",
    endereco:
      "R. Sebastião Ferreira dos Santos, 117 - Centro, Itaquaquecetuba - SP, 08570-060",
    pontoReferencia:
      "Hospital Ipiranga, ao lado da farmácia 'pague menos'",
   
    expedienteSemana: {
      inicio: "09:00",
      fim: "17:45",
    },
    expedienteFimDeSemana: {
      inicio: "09:00",
      fim: "16:45",
    },
  },
];

const ENDERECOS_GOLDEN_MIX = [
  {
    bairro: "Tucuruvi",
    endereco: " Av Tucuruvi, 689-Tucuruvi,São Paulo-SP,02305-001",
    pontoReferencia: " Proximo ao Metrô Tucuruvi",
    horarioAlmoco: {
      inicio: "12:00",
      fim: "13:00",
    },
    expedienteSemana: {
      inicio: "09:00",
      fim: "18:00",
    },
    expedienteFimDeSemana: {
      inicio: "09:00",
      fim: "14:00",
    },
  },

  {
    bairro: "Americana",
    endereco: "Praça Basilio Rangel, 11-Centro,Americana-SP,13465-519",
    pontoReferencia: " Em frente ao terminal rodoviário",
    horarioAlmoco: {
      inicio: "12:40",
      fim: "13:40",
    },
    expedienteSemana: {
      inicio: "09:00",
      fim: "18:00",
    },
    expedienteFimDeSemana: {
      inicio: "09:00",
      fim: "18:00",
    },
  },

//
{
  bairro: "Diadema Eldorado",
  endereco: "Av. Nossa Sra. dos Navegantes, 804 - Eldorado, Diadema - SP, 09972-385",
  pontoReferencia: " Ao lado da Ultrafarma",
  
  horarioAlmoco: {
    inicio: "13:00",
    fim: "14:00",

  },
  expedienteFimDeSemana:{
    inicio:"09:00",
    fim:"17:30",
  },
  
  expedienteSemana: {
    inicio: "09:00",
    fim: "18:00",
  },
},


  /*{
    bairro: "Indaiá Itaqua",
    endereco: "R.Cap. José Leite, 44 - Centro,Itaquaquecetuba-SP,08570-030",
    pontoReferencia: " Ao lado da loja Marabraz",
    horarioAlmoco: null,
    expedienteSemana: {
      inicio: "09:00",
      fim: "18:30",
    },
    expedienteFimDeSemana: {
      inicio: "09:00",
      fim: "17:00",
    },
  },

  {
    bairro: " Menininha",
    endereco:
      "  Estrada Do M'Boi Mirim, 6059-Parque Do Lago,São Paulo - SP,04941-003",
    pontoReferencia: " Ao lado da loja Caedu",
    horarioAlmoco: {
      inicio: "13:00",
      fim: "14:00",
    },
    expedienteSemana: {
      inicio: "09:00",
      fim: "17:30",
    },
    expedienteFimDeSemana: {
      inicio: "09:00",
      fim: "16:00",
    },
  },
  {
    bairro: "Indaiá Itapevi",
    endereco: " Av. Rubens Caramez, 55 - Centro,itapevi - SP- 06653-005 ",
    pontoReferencia: " De Frente a Farmácia Drogasil",
    horarioAlmoco: {
      inicio: "13:00",
      fim: "14:00",
    },
    expedienteSemana: {
      inicio: "09:00",
      fim: "17:30",
    },
    expedienteFimDeSemana: {
      inicio: "09:00",
      fim: "17:30",
    },
  },*/
  
  {
    bairro: "Francisco Morato",
    endereco: " Rua Gerõnimo Caetano Garcia, 134 -SP, 07901-000",
    pontoReferencia: " De Frente Casas Bahia",
    horarioAlmoco: {
      inicio: "13:00",
      fim: "14:00",
    },
    expedienteSemana: {
      inicio: "09:00",
      fim: "18:00",
    },
    expedienteFimDeSemana: {
      inicio: "09:00",
      fim: "18:00",
    },
  },


  {
    bairro: "Salto",
    endereco: "Rua Nove de Julho, 180 -Centro,Salto -SP,133320-005",
    pontoReferencia: "Ao lado das Pernambucanas",
    horarioAlmoco: {
      inicio: "12:00",
      fim: "13:00",
    },
    expedienteSemana: {
      inicio: "09:00",
      fim: "17:45",
    },
    expedienteFimDeSemana: {
      inicio: "09:00",
      fim: "13:30",
    },
  },

  {
    bairro: "Cocaia",
    endereco:
      "Rua Rubens De Oliveira, 412,- Parque Res.Cocaia,São Paulo- SP,04849-210",
    pontoReferencia: " Ao lado das Casas Bahia Do Residencial Cocaia",
    horarioAlmoco: {
      inicio: "13:00",
      fim: "14:00",
    },
    expedienteSemana: {
      inicio: "09:00",
      fim: "18:00",
    },
    expedienteFimDeSemana: {
      inicio: "09:00",
      fim: "18:00",
    },
  },

  {
    bairro: " Tatui",
    endereco: " Rua Onze De Agosto, 462- Centro,Tatuí-SP,18270-001",
    pontoReferencia: " Ao lado da Sergio Calçado",
 
    expedienteSemana: {
      inicio: "09:00",
      fim: "18:00",
    },
    expedienteFimDeSemana: {
      inicio: "09:00",
      fim: "13:45",
    },
  },
/*
  {
    bairro: "Suzano",
    endereco:
      "Rua General Francisco Glicério, 394-Centro,Suzano-SP,08674-000,04849-210",
    pontoReferencia: "Proximo a Magazine Luiza e Casas Bahia",
    horarioAlmoco: null,
    expedienteSemana: {
      inicio: "09:00",
      fim: "16:00",
    },
    expedienteFimDeSemana: null,
  },
  */
  {
    bairro: " São José Do Rio Preto",
    endereco:
      " Rua Bernardino De Campos, 2828,Centro- São José Do Rio Preto - 015015300",
    pontoReferencia: " Entre a loja Lívias e o Banco Itaú",
    horarioAlmoco: {
      inicio: "13:00",
      fim: "14:00",
    },
    expedienteSemana: {
      inicio: "09:00",
      fim: "17:30",
    },
    expedienteFimDeSemana: {
      inicio: "09:00",
      fim: "13:30",
    },
  },

  {
    bairro: " Caçapava",
    endereco: " Rua Capitão João Ramos, 156- Centro Caçapava",
    pontoReferencia: "Fica no Calçadão,proximo da ArtPel",
    horarioAlmoco: {
      inicio: "13:00",
      fim: "14:00",
    },
    expedienteSemana: {
      inicio: "09:00",
      fim: "18:00",
    },
    expedienteFimDeSemana: {
      inicio: "09:00",
      fim: "14:00",
    },
  },
];

const ENCERECOS_GOLDEN_MIX_2 = [
 {
    bairro: "Votorantim ",
    endereco: " Av.31 Março, 686 - Centro de Votorantim  SP 18110-005",
    pontoReferencia: " Ao Lado Loja Montreal",
    horarioAlmoco: {
      inicio: "13:00",
      fim: "14:00",
    },
    expedienteSemana: {
      inicio: "09:00",
      fim: "17:10",
    },
    expedienteFimDeSemana: {
      inicio: "09:00",
      fim: "14:45",
    },
  },

  {
    bairro: "Bauru",
    endereco: "R.Batista De Carvalho, 413- Quadra 4 centro Bauru Sp- 17010-0001",
    pontoReferencia: " em frente a Drogasil do calçadão Batista de Carvalho",
    horarioAlmoco:{
     inicio: "12:00",
    fim: "13:00",
  },
    expedienteSemana: {
      inicio: "09:15",
      fim: "17:00",
    },
    expedienteFimDeSemana: {
      inicio: "09:30",
      fim: "15:10",
    },
  },

  {
    bairro: "Piracicaba",
    endereco:
      "R.Gov . Pedro de Toledo, 1231 - Centro Piracicaba - SP - 13400-07008570-030",
    pontoReferencia: "Ao lado da loja Cibellar na esquina",
    horarioAlmoco: {
      inicio: "13:00",
      fim: "14:00",
    },
    expedienteSemana: {
      inicio: "09:00",
      fim: "17:30",
    },
    expedienteFimDeSemana: {
      inicio: "09:00",
      fim: "13:00",
    },
  },
/**/
  {
    bairro: " Taubate",
    endereco: "  Praça Dom Epaminondas, 47-Centro, Taubate-SP, 12010-020",
    pontoReferencia: " Ao Lado da Shoebez",
    horarioAlmoco: {
      inicio: "12:00",
      fim: "13:30",
    },
    expedienteSemana: {
      inicio: "09:00",
      fim: "16:45",
    },
    expedienteFimDeSemana: {
      inicio: "09:00",
      fim: "14:00",
    },
  },
  

  {
    bairro: "Hortolandia",
    endereco:
      " R. Luis Camilo de Camargo, 498-Jardim Santana Hortolandia-SP,13184-420",
    pontoReferencia: " Próximo Banco Santander",
    horarioAlmoco: {
      inicio: "13:00",
      fim: "14:00",
    },
    expedienteSemana: {
      inicio: "09:00",
      fim: "17:45",
    },
    expedienteFimDeSemana: {
      inicio: "09:00",
      fim: "13:40",
    },
  },

  {
    bairro: "Nicolau",
    endereco:
      "Praça Comendador Nicolau Scarpa, 53 - Centro, Sorocaba - SP, 18010-180",
    pontoReferencia: "Próximo praça do Relogio",
    horarioAlmoco: {
      inicio: "12:00",
      fim: "13:00",
    },
    expedienteSemana: {
      inicio: "09:00",
      fim: "18:00",
    },
    expedienteFimDeSemana: {
      inicio: "09:00",
      fim: "15:00",
    },
  },
  
  {
    bairro: "Sorocaba",
    endereco: "Rua Barão do Rio Branco, 51 - Centro, Sorocaba - SP, 18010-170",
    pontoReferencia: "Em frente a Sérgio Calçados",
    
    horarioAlmoco: {
      inicio: "13:00",
      fim: "14:00",
    },
    
    expedienteSemana: {
      inicio: "09:30",
      fim: "18:00",
    },
    expedienteFimDeSemana: {
      inicio: "08:30",
      fim: "12:30",
    },
  },


  {
    bairro: " Itapetininga ",
    endereco: " R.Dr Campos Salles, 677-Centro,Itapetininga-SP-18200-005",
    pontoReferencia: "  Fica inicio da rua campos salles. Primeiro Quarterão",
    horarioAlmoco: {
      inicio: "12:00",
      fim: "13:00",
    },
    expedienteSemana: {
      inicio: "09:00",
      fim: "18:00",
    },
    expedienteFimDeSemana: {
      inicio: "09:00",
      fim: "14:30",
    },
  },


  {
    bairro: " Ribeirão Preto",
    endereco: " R.Americo Brasiliense, 557 - Centro Ribeirão",
    pontoReferencia: " Ao Lado da sorveteria do JÔ muito antiga e tradicional da cidade",
    horarioAlmoco: {
      inicio: "12:30",
      fim: "13:30",
    },
    expedienteSemana: {
      inicio: "09:00",
      fim: "17:30",
    },
    expedienteFimDeSemana: {
      inicio: "09:00",
      fim: "13:00",
    },
  },

  {
    bairro: " Bragança Paulista",
    endereco: "R. Coronel Teofilo Leme, 1379 - Centro de Bragança Paulista ",
    pontoReferencia: " Próximo ao Banco Itaú",
    horarioAlmoco: {
      inicio: "13:00",
      fim: "14:00",
    },
    expedienteSemana: {
      inicio: "09:00",
      fim: "17:40",
    },
    expedienteFimDeSemana: {
      inicio: "09:00",
      fim: "15:00",
    },
  },

];


const ENCERECOS_GOLDEN_MIX_3 = [
  /*{
    bairro: "José Paulino ",
    endereco: " Rua José Paulino,1047 - Centro Campinas",
    pontoReferencia: " Próximo à Catedral ",

    expedienteSemana: {
      inicio: "09:00",
      fim: "17:40",
    },
    expedienteFimDeSemana: {
      inicio: "09:00",
      fim: "15:00",
    },
  },
*/
  {
    bairro: "Rubião",
    endereco: "Rua Rubião Júnior,27 - Centro De São José Dos Campos ",
    pontoReferencia: " Em frente ao shopping Centro",

    expedienteSemana: {
      inicio: "09:00",
      fim: "18:00",
    },
    expedienteFimDeSemana: {
      inicio: "09:00",
      fim: "15:30",
    },
  },

  {
    bairro: "Praia Grande",
    endereco:
      "Av. Presidente Costa E Silva, 613",
    pontoReferencia: "Prédio Millas",
    horarioAlmoco: {
      inicio: "13:00",
      fim: "14:00",
    },
    expedienteSemana: {
      inicio: "09:00",
      fim: "17:30",
    },
    expedienteFimDeSemana: {
      inicio: "09:00",
      fim: "16:00",
    },
  },

  {
    bairro: " Guarujá",
    endereco: "  Av. Thiago Ferreira, 686 - Vila Alice Vicente de Carvalho",
    pontoReferencia: " Em Frente a Torra-Torra",
    
    expedienteSemana: {
      inicio: "09:00",
      fim: "18:00",
    },
    expedienteFimDeSemana: {
      inicio: "09:00",
      fim: "17:00",
    },
  },

  {
    bairro: "Campos Sales",
    endereco:
      " Av.Campos Sales,700 - Centro Campinas",
    pontoReferencia: " Ao lado da loja Marabraz",
    horarioAlmoco: {
      inicio: "12:30",
      fim: "13:30",
    },
    expedienteSemana: {
      inicio: "09:00",
      fim: "17:30",
    },
    expedienteFimDeSemana: {
      inicio: "09:00",
      fim: "14:30",
    },
  },

  {
    bairro: "Cubatão ",
    endereco:
      "Av.9 de Abril, 2100 - Centro Cubatão",
    pontoReferencia: "Ao lado da loja Doutor Sono",
    horarioAlmoco: {
      inicio: "12:30",
      fim: "13:30",
    },
    expedienteSemana: {
      inicio: "09:00",
      fim: "18:00",
    },
    expedienteFimDeSemana: {
      inicio: "09:00",
      fim: "16:00",
    },
  },
  
  {
    bairro: "Limeira",
    endereco: "R. Dr. Trajano de Barros Camargo, 802 - Centro",
    pontoReferencia: "Perto das lojas Magazine",
    horarioAlmoco: {
      inicio: "13:00",
      fim: "14:00",
    },
    expedienteSemana: {
      inicio: "09:00",
      fim: "17:40",
    },
    expedienteFimDeSemana: {
      inicio: "09:00",
      fim: "14:00",
    },
  },
/*
  {
    bairro: " Calçadão-SJC ",
    endereco: " R. Sete de Setembro, 377 - Centro",
    pontoReferencia: " Praça do Sapo",
    horarioAlmoco: {
      inicio: "12:00",
      fim: "14:00",
    },
    expedienteSemana: {
      inicio: "09:00",
      fim: "17:40",
    },
    expedienteFimDeSemana: {
      inicio: "09:00",
      fim: "15:30",
    },
  },
*/
  {
    bairro: "Diadema",
    endereco: "Av. Antônio Piranga, 35 - Centro",
    pontoReferencia:
      "Próximo ao Terminal de ônibus de Diadema ",
    horarioAlmoco: {
      inicio: "13:00",
      fim: "14:00",
    },
    expedienteSemana: {
      inicio: "09:00",
      fim: "18:00",
    },
    expedienteFimDeSemana: {
      inicio: "09:00",
      fim: "16:30",
    },
  },

  {
    bairro: " Carapicuíba",
    endereco: " Av.Rui Barbosa,312 - Centro Carapicuíba",
    pontoReferencia: " Em frente ao Banco Itaú do Calçadão Principal ",
   
    expedienteSemana: {
      inicio: "09:00",
      fim: "18:00",
    },
    expedienteFimDeSemana: {
      inicio: "09:00",
      fim: "16:00",
    },
  },

  {
    bairro: " Grajau",
    endereco: " Av. Dona Belmira Marin, 1060 - Parque Brasil",
    pontoReferencia: " Em frente a Caixa Economica Federal ",
    horarioAlmoco: {
      inicio: "13:00",
      fim: "14:00",
    },
    expedienteSemana: {
      inicio: "09:00",
      fim: "17:30",
    },
    expedienteFimDeSemana: {
      inicio: "09:00",
      fim: "16:30",
    },
  },
  

  {
    bairro: " Franco Da Rocha",
    endereco: "Rua Dona Amália Sejtini,125 - Centro ",
    pontoReferencia: " Próximo ao Banco Itaú",
   
    
    expedienteSemana: {
      inicio: "08:30",
      fim: "18:30",
    },

    expedienteFimDeSemana: {
      inicio: "09:00",
      fim: "16:30",
    },
    
  },

  {
    bairro: " Vila Galvão",
    endereco: "Rua Treze de Maio, 312 -Vila Galvão -Cep 07071-050",
    pontoReferencia: "Vizinha de Parede da Hering, Casa Bahia, Magazine Luiza e Americanas ",
    horarioAlmoco: {
      inicio: "13:00",
      fim: "14:00",
    },
    expedienteSemana: {
      inicio: "09:30",
      fim: "17:30",
    },
    expedienteFimDeSemana: {
      inicio: "09:30",
      fim: "17:30",
    },
  },

  {
    bairro: "Limeira ",
    endereco:
      "R. Dr. Trajano de Barros Camargo, 802 - Centro",
    pontoReferencia: "Perto das lojas Magazine ",
    horarioAlmoco: {
      inicio: "13:00",
      fim: "14:00",
    },
    expedienteSemana: {
      inicio: "09:00",
      fim: "17:40",
    },
    expedienteFimDeSemana: {
      inicio: "09:00",
      fim: "14:00",
    },
  },

  {
    bairro: "Araraquara ",
    endereco:
      "Rua Nove De Julho, 908,Centro -14802277",
    pontoReferencia: "Próximo ao Shoppping Lupo ",
    horarioAlmoco: {
      inicio: "12:00",
      fim: "13:00",
    },
    expedienteSemana: {
      inicio: "09:00",
      fim: "18:00",
    },
    expedienteFimDeSemana: {
      inicio: "09:00",
      fim: "17:00",
    },
  },
];


const ENCERECOS_GOLDEN_MIX_4 = [
 
  {
    bairro: "Cidade Dutra ",
    endereco: " Avenida Senador Teotônio Vilela, 1102 - Cidade Dutra",
    pontoReferencia: " Em frente a Faisal ",
    horarioAlmoco:{
      inicio: "13:00",
      fim: "14:00"
    },
    expedienteSemana: {
      inicio: "09:00",
      fim: "18:00",
    },
    expedienteFimDeSemana: {
      inicio: "09:00",
      fim: "16:30",
    },
  },

  {
    bairro: "Freguesia Do Ó",
    endereco: "Av Itaberaba, 2069 - Freguesia Do Ó",
    pontoReferencia: " Em frente a Igreja Santa Cruz",
    horarioAlmoco: {
      inicio:"13:00",
      fim:"14:00",
    },
    expedienteSemana: {
      inicio: "09:00",
      fim: "18:00",
    },
    expedienteFimDeSemana: {
      inicio: "09:00",
      fim: "14:00",
    },
  },

  {
    bairro: "Itapevi",
    endereco:
      " Av. Rubens Caramez, 32 - Centro, Itapevi - SP, 06653-005",
    pontoReferencia: "Proximo Da Farmacia Drogasil",
    horarioAlmoco: {
      inicio: "13:00",
      fim: "14:00",
    },
    expedienteSemana: {
      inicio: "09:00",
      fim: "18:00",
    },
    expedienteFimDeSemana: {
      inicio: "09:00",
      fim: "17:00",
    },
  },
/*
  {
    bairro: " Suzano",
    endereco: "  Rua General Francisco Glicério, 405",
    pontoReferencia: " Próximo a Casas Bahia Em Frente A Loja De Sapato Humanitárian",
    
    horarioAlmoco:{
    inicio:"14:00",
    fim:"15:00",
    },
    expedienteSemana: {
      inicio: "09:00",
      fim: "18:00",
    },
    expedienteFimDeSemana: {
      inicio: "09:00",
      fim: "17:00",
    },
  },
*/
/*  {
    bairro: "Frei Gaspar",
    endereco:
      " Rua Frei Gaspar, 726 - Centro",
    pontoReferencia: " Próximo ao Shopping Deslumbrande e próximo ao Hospital São José",
    
    expedienteSemana: {
      inicio: "09:00",
      fim: "17:00",
    },
    expedienteFimDeSemana: {
      inicio: "09:00",
      fim: "17:30",
    },
  },

  {
    bairro: "Piraporinha ",
    endereco:
      "Estrada do M'Boi Mirim, 885 - Jardim das Flores",
    pontoReferencia: "Em frente a Magazine Luiza ",
    horarioAlmoco: {
      inicio: "12:00",
      fim: "13:30",
    },
    expedienteSemana: {
      inicio: "09:00",
      fim: "17:30",
    },
    expedienteFimDeSemana: {
      inicio: "09:00",
      fim: "16:00",
    },
  },

  {
    bairro: "Jacarei ",
    endereco:
      "R. Dr. Lúcio Malta, 353 - Centro, Jacareí - SP, 12237-000",
    pontoReferencia: "Do lado do mercadão municipal ",
    horarioAlmoco: {
      inicio: "13:00",
      fim: "14:00",
    },
    expedienteSemana: {
      inicio: "09:00",
      fim: "17:30",
    },
    expedienteFimDeSemana: {
      inicio: "09:00",
      fim: "15:30",
    },
  },

  {
    bairro: "Itaquaquecetuba",
    endereco: "Praça Dos Expedicionários, 44 - Centro",
    pontoReferencia: "Em Frente Ao Itaú,próximo ao Torra Torra",
    horarioAlmoco: {
      inicio: "13:00",
      fim: "14:00",
    },
    expedienteSemana: {
      inicio: "09:00",
      fim: "18:00",
    },
    expedienteFimDeSemana: {
      inicio: "09:00",
      fim: "17:00",
    },
  },

  {
    bairro: " São Vicente ",
    endereco: " Praça Barão do Rio Branco, 57",
    pontoReferencia: " Proximo as Casas Bahia ",
   
    expedienteSemana: {
      inicio: "09:00",
      fim: "17:50",
    },
    expedienteFimDeSemana: {
      inicio: "09:00",
      fim: "16:50",
    },
  },

  {
    bairro: "Parelheiros",
    endereco: "Estrada da Colônia, 232 - Jd Novo Parelheiros - 0489-2000",
    pontoReferencia:
      "Proximo as Casas Bahia ",
    horarioAlmoco: {
      inicio: "13:00",
      fim: "14:00",
    },
    expedienteSemana: {
      inicio: "09:00",
      fim: "17:30",
    },
    expedienteFimDeSemana: {
      inicio: "09:00",
      fim: "16:30",
    },
  },*/
/*
  {
    bairro: " Álvares Machado",
    endereco: " Av .Álvares Machado - Centro de Campinas, 943 - 13013-071 ",
    pontoReferencia: " Próximo a Magazine Damanos   ",
   
    expedienteSemana: {
      inicio: "08:30",
      fim: "19:40",
    },
    expedienteFimDeSemana: {
      inicio: "08:30",
      fim: "15:30",
    },
  },

  {
    bairro: " Jd. Angela",
    endereco: " Estrada do M.Boi Mirim, 4005- 04935-053",
    pontoReferencia: " Ao Lado das Casas Bahia / base policial  ",
    horarioAlmoco: {
      inicio: "13:00",
      fim: "14:00",
    },
    expedienteSemana: {
      inicio: "09:00",
      fim: "18:00",
    },
    expedienteFimDeSemana: {
      inicio: "09:00",
      fim: "16:15",
    },
  },*/
  

 



];

/*const ENDERECOS_Indaia = [
  {
    bairro: "Indaiá Suzano",
    endereco: "Rua General Francisco Glicério, 394 - Centro, Suzano - SP, 08674-000 ",
    pontoReferencia: " Próximo à Magazine Luiza e a Casas Bahia",
  
    expedienteSemana: {
      inicio: "09:00",
      fim: "16:00",
    },
  
  },

  {
    bairro: "Indaiá Itaqua",
    endereco: "R. Cap. José Leite, 44 - Centro, Itaquaquecetuba - SP, 08570-030",
    pontoReferencia: " Ao lado da loja Marabraz",
  
    expedienteSemana: {
      inicio: "09:00",
      fim: "18:30",
    },
    expedienteFimDeSemana: {
      inicio: "09:00",
      fim: "17:00",
    },
  
  },

  {
    bairro: "Indaiá Itapevi",
    endereco: "Av. Rubens Caramez, 55 - Centro, Itapevi - SP - 06653-005",
    pontoReferencia: " Em frente à Farmácia Drogasil ",
    horarioAlmoco: {
      inicio: "13:00",
      fim: "14:00",
    },
    expedienteSemana: {
      inicio: "09:00",
      fim: "18:00",
    },
    expedienteFimDeSemana: {
      inicio: "09:00",
      fim: "17:00",
    },
  },
];*/
const ENDERECOS_MANIA = [
  {
    bairro: "Ponta Grossa",
    endereco: "R. Fernandes Pinheiro, 260 - Centro, Ponta Grossa - PR, 84010-135",
    pontoReferencia: "Ao lado da loja Utilidades - Presentes",
    
    horarioAlmoco: {
      inicio: "12:00",
      fim: "13:00",

    },
    expedienteFimDeSemana:{
      inicio:"09:00",
      fim:"14:00",
    },
    
    expedienteSemana: {
      inicio: "09:00",
      fim: "17:00",
    },
  },
]

const ENDERECOS_Occlus = [
  {
    bairro: "Jardim Iguatemi",
    endereco: "Avenida Ragueb Chofhi, número 5015",
    pontoReferencia: "Próximo ao Shopping Negreiros",
    
    horarioAlmoco: {
      inicio: "14:00",
      fim: "15:00",
    },
    
    expedienteSemana: {
      inicio: "10:00",
      fim: "17:00",
    },
  },
];
const ENDERECOS_Videre = [
  {
    bairro: "Americana",
    endereco: "Rua Doutor Vieira Bueno, 25- Centro de Americana",
    pontoReferencia: "No Calçadão ao lado do chiquinho sorvetes",
    
    horarioAlmoco: {
      inicio: "13:00",
      fim: "14:00",

    },
    expedienteFimDeSemana:{
      inicio:"09:00",
      fim:"15:00",
    },
    
    expedienteSemana: {
      inicio: "09:00",
      fim: "18:00",
    },
  },
]

const ENDERECOS_Lauren = [
  {
    bairro: "Santa Barbara D'Oeste",
    endereco: "Rua General Osório,491- Centro, Santa Barbara D'Oeste",
    pontoReferencia: "Em frente á loja CEM",
    
    horarioAlmoco: {
      inicio: "12:00",
      fim: "13:00",

    },
    expedienteFimDeSemana:{
      inicio:"09:00",
      fim:"13:40",
    },
    
    expedienteSemana: {
      inicio: "09:00",
      fim: "18:00",
    },
  },
]
const ENDERECOS_Vimais = [
  {
    bairro: "Americana",
    endereco: "Rua 12 novembro, 458 - Centro de Americana",
    pontoReferencia: "Banco do Brasil, odonto company e restaurante Pomodoro",
    
    horarioAlmoco: {
      inicio: "12:00",
      fim: "13:00",

    },
    expedienteFimDeSemana:{
      inicio:"08:30",
      fim:"12:00",
    },
    
    expedienteSemana: {
      inicio: "08:30",
      fim: "15:30",
    },
  },
]

const ENDERECOS_Fotica = [
  {
    bairro: "Santa Barbara D'Oeste",
    endereco: "Rua General Osório, 528 - Centro, Santa Barbara D'Oeste",
    pontoReferencia: "Em frente á loja CEM",
    
    horarioAlmoco: {
      inicio: "12:00",
      fim: "13:00",

    },
    expedienteFimDeSemana:{
      inicio:"10:00",
      fim:"13:40",
    },
    
    expedienteSemana: {
      inicio: "10:00",
      fim: "18:00",
    },
  },
  
]
const ENDERECOS_acaz = [
  {
    bairro: "SÃO BERNADO DO CAMPO",
    endereco: "R. Dr. Fláquer, 209 - Travessa Da Marechal",
    pontoReferencia: "Ao lado do Matheus Presentes",

    horarioAlmoco: {
      inicio: "12:00",
      fim: "13:00",

    },
    expedienteFimDeSemana:{
      inicio:"10:00",
      fim:"13:40",
    },

    expedienteSemana: {
      inicio: "09:00",
      fim: "17:00",
    },
  },
]

const OTICAS_ENDERECOS = {
  //Benetti: ENDERECOS_BENETTI,
  //Lelli: ENDERECOS_LELLI,
  //Perci: ENDERECOS_PERCI,
  Zaff:ENCERECOS_ZAFF,
  Raza: ENDERECOS_RAZA,
 // Venice: ENDERECOS_VENICE,
  //Midas: ENDERECOS_MIDAS,
  //Stile: ENDERECOS_STILE,
//SmartNew: ENDERECOS_Smart_New,
// DoisIrmaos: ENDERECOS_2_IRMAOS,
  GoldenMix: ENDERECOS_GOLDEN_MIX,
  GoldenMix2: ENCERECOS_GOLDEN_MIX_2,
  GoldenMix3: ENCERECOS_GOLDEN_MIX_3,
  //GoldenMix4: ENCERECOS_GOLDEN_MIX_4,
  MANIA: ENDERECOS_MANIA,
 // Videre: ENDERECOS_Videre,
  //Lauren:ENDERECOS_Lauren,
  //Occlus: ENDERECOS_Occlus,
  //Vimais:ENDERECOS_Vimais,
  //acaz: ENDERECOS_acaz,
  //Fotica: ENDERECOS_Fotica,

}; 

// FUNCOES AUXILIARES
function deletarFilhosDoElemento(idElemento) {
  const elemento = document.getElementById(idElemento);

  if (elemento) {
    while (elemento.firstChild) {
      elemento.removeChild(elemento.firstChild);
    }
  }
}

const generateLocalDate = (dateAsString) =>
  new Date(`${dateAsString}T00:00:00`);

const obterEnderecosOtica = (otica, bairro) =>
  OTICAS_ENDERECOS[otica].find((endereco) => endereco.bairro === bairro);

const dataEhDiaDeSemana = (date) => date.getDay() !== 0 && date.getDay() !== 6;

// INICIO VALIDAÇOES DO FORMULÁRIO

const camposObrigatoriosPossuemValor = (formFields) => {
  const emptyFields = Object.keys(formFields).filter(
    (field) => !formFields[field]
  );

  return emptyFields == 0;
};

const gerarErroCamposObrigatoriosFaltando = (formFields) => {
  const emptyFields = Object.keys(formFields).filter(
    (field) => !formFields[field]
  );

  const conteiner = document.createElement("div");
  const spanElement = document.createElement("span");
  const ulElement = document.createElement("ul");

  spanElement.textContent = "Os campos a seguir devem ser preenchidos: ";

  emptyFields.forEach((emptyField) => {
    const liElement = document.createElement("li");
    liElement.textContent = `${emptyField};`;
    ulElement.appendChild(liElement);
  });

  conteiner.appendChild(spanElement);
  conteiner.appendChild(ulElement);

  exibirModalError(conteiner);
};

const dataAgendamentoEhDomingo = ({ date }) => {
  const dateAsObject = generateLocalDate(date);
  return dateAsObject.getDay() === 0;
};

const dataAgendamentoEhSabadoEOticaTrabalha = ({ otica, date, local }) => {
  const dateAsObject = generateLocalDate(date);
  const dataEhSabado = dateAsObject.getDay() === 6;
  const oticaAbreSabado =
    obterEnderecosOtica(otica, local).expedienteFimDeSemana !== null;

  return !dataEhSabado || (dataEhSabado && oticaAbreSabado);
};

const gerarErroDataDomingo = ({ otica }) => {
  const spanElement = document.createElement("span");
  spanElement.textContent = `Otica '${otica}' não abre aos Domingos`;

  exibirModalError(spanElement);
};

const gerarErroNaoAbreSabados = ({ otica, local }) => {
  const spanElement = document.createElement("span");
  spanElement.textContent = `Otica '${otica}' do bairro '${local}' não abre aos Sábados`;

  exibirModalError(spanElement);
};

const horarioEscolhidoDentroDeIntervalo = (
  horariosPermitidos,
  horarioParaTestar
) => {
  if (horariosPermitidos == null) {
    return false;
  }

  const inicioPermitido = new Date(
    "1970-01-01T" + horariosPermitidos.inicio + ":00"
  );
  const finalPermitido = new Date(
    "1970-01-01T" + horariosPermitidos.fim + ":00"
  );
  const horarioEscolhido = new Date("1970-01-01T" + horarioParaTestar + ":00");

  return (
    inicioPermitido <= horarioEscolhido && horarioEscolhido <= finalPermitido
  );
};

const horaAgendamentoValido = ({ otica, local, date, time }) => {
  const localSelecionado = obterEnderecosOtica(otica, local);

  if (localSelecionado) {
    const dateAsObject = generateLocalDate(date);

    if (
      horarioEscolhidoDentroDeIntervalo(localSelecionado.horarioAlmoco, time)
    ) {
      return false;
    }

    if (dataEhDiaDeSemana(dateAsObject)) {
      return horarioEscolhidoDentroDeIntervalo(
        localSelecionado.expedienteSemana,
        time
      );
    }

    return horarioEscolhidoDentroDeIntervalo(
      localSelecionado.expedienteFimDeSemana,
      time
    );
  }
};

const gerarErroHorarioAgendamento = ({ otica, local }) => {
  const endereco = obterEnderecosOtica(otica, local);
  const conteiner = document.createElement("div");

  const spanElement1 = document.createElement("span");
  spanElement1.textContent = "Horário selecionado não permitido.";

  const spanElement2 = document.createElement("span");
  spanElement2.textContent = "Horários de funcionamento da unidade: ";

  const ulElement = document.createElement("ul");

  const liElement1 = document.createElement("li");
  liElement1.textContent = `De semana: ${endereco.expedienteSemana.inicio} - ${endereco.expedienteSemana.fim};`;

  const liElement2 = document.createElement("li");
  liElement2.textContent = `Fins de semana: ${
    endereco.expedienteFimDeSemana === null
      ? "Não abre"
      : `${endereco.expedienteFimDeSemana.inicio} - ${endereco.expedienteFimDeSemana.fim};`
  }`;

  const liElement3 = document.createElement("li");
  liElement3.textContent = `Almoço: ${
    endereco.horarioAlmoco === null
      ? "Não cadastrado"
      : `${endereco.horarioAlmoco.inicio} - ${endereco.horarioAlmoco.fim};`
  }`;

  ulElement.appendChild(liElement1);
  ulElement.appendChild(liElement2);
  ulElement.appendChild(liElement3);

  conteiner.appendChild(spanElement1);
  conteiner.appendChild(spanElement2);
  conteiner.appendChild(ulElement);

  exibirModalError(conteiner);
};

// FIM VALIDAÇOES DO FORMULÁRIO

function captureAndSave() {
  // Captura o elemento voucherMessage
  var elementToCapture = document.getElementById("voucherMessage");

  // Usa html2canvas para capturar a tela
  html2canvas(elementToCapture).then(function (canvas) {
    // Converte o canvas para uma imagem URL
    var dataURL = canvas.toDataURL();

    // Cria um link temporário e define o atributo de download para salvar a imagem
    var link = document.createElement("a");
    link.href = dataURL;
    link.download = "voucher.png";

    // Simula um clique no link para iniciar o download
    link.click();
  });
}

function generateVoucher() {
  const formData = getFormData();
  sendFormData(formData);
  const formFields = {
    name: document.getElementById("name").value,
    contato: document.getElementById("contato").value,
    local: document.getElementById("local").value,
    otica: document.getElementById("otica").value,
    date: document.getElementById("date").value,
    time: document.getElementById("time").value,
    nomeOperador: document.getElementById("nomeOperador").value,
    idOperador: document.getElementById("idOperador").value,
  };

  if (!camposObrigatoriosPossuemValor(formFields)) {
    exibirModalError(gerarErroCamposObrigatoriosFaltando(formFields));
  } else if (dataAgendamentoEhDomingo(formFields)) {
    exibirModalError(gerarErroDataDomingo(formFields));
  } else if (!dataAgendamentoEhSabadoEOticaTrabalha(formFields)) {
    exibirModalError(gerarErroNaoAbreSabados(formFields));
  } else if (!horaAgendamentoValido(formFields)) {
    exibirModalError(gerarErroHorarioAgendamento(formFields));
  } else {
    const partesDaData = formFields.date.split("-");
    const dataFormatada = `${partesDaData[2]}/${partesDaData[1]}/${partesDaData[0]}`;
    const dadosOtica = obterEnderecosOtica(formFields.otica, formFields.local);

    const formFieldsAtualizado = {
      ...formFields,
      date: dataFormatada,
      local: dadosOtica.endereco,
    };

    const templatePreenchido = Mustache.render(
      TICKET_TEMPLATE,
      formFieldsAtualizado
    );

    deletarFilhosDoElemento("voucherMessage");
    $("#voucherMessage").append(templatePreenchido);
    $("#voucherMessage").removeClass("hide-element");
  }
}

function definirLabelEndereco(endereco, bairro) {
  const pedacosEndereco = endereco.split(",");
  const ruaComNumero = `${pedacosEndereco[0]}${pedacosEndereco[1]}`;

  return ruaComNumero.endsWith(bairro)
    ? ruaComNumero
    : `${ruaComNumero} - ${bairro}`;
}

function carregarOticasNoDropdown() {
  const selectOperadores = document.getElementById("otica");
  const todasOticas = Object.keys(OTICAS_ENDERECOS);

  todasOticas.forEach((key) => {
    const option = document.createElement("option");
    option.value = key;
    option.text = key;
    selectOperadores.appendChild(option);
  });

  carregarEnderecosNoDropdown(todasOticas[0]);
}

function carregarEnderecosNoDropdown(oticaSelecionada) {
  OTICAS_ENDERECOS[oticaSelecionada].forEach((loja) => {
    const option = document.createElement("option");
    option.value = loja.bairro;
    option.text = definirLabelEndereco(loja.endereco, loja.bairro);

    document.getElementById("local").appendChild(option);
  });
}
// Funçao para adicionar o Telefone

function formatarTelefone(input) {
  // Remove qualquer caractere que não seja número
  var numeroTelefone = input.value.replace(/\D/g, '');

  // Formatação do número
  if (numeroTelefone.length === 11) {
      // (XX) XXXXX-XXXX
      input.value = '(' + numeroTelefone.substring(0, 2) + ') ' + numeroTelefone.substring(2, 7) + '-' + numeroTelefone.substring(7);
  } else if (numeroTelefone.length === 10) {
      // (XX) XXXX-XXXX
      input.value = '(' + numeroTelefone.substring(0, 2) + ') ' + numeroTelefone.substring(2, 6) + '-' + numeroTelefone.substring(6);
  }

}

function formataData() {
  let data = new Date();
  const dia = data.getDate();
  const mes = data.getMonth() + 1; // Os meses em JavaScript são baseados em zero (janeiro = 0)
  const ano = data.getFullYear();

  const dataFormatada = `${dia}/${mes}/${ano}`;
  console.log(dataFormatada);
}

// FUNCOES MODAL DE ERRO

function fecharModalErro() {
  document.getElementById("modalErro").classList.add("hide-element");
  document.getElementById("modalErroOverlay").classList.add("hide-element");
  deletarFilhosDoElemento("conteudoModalErro");
}

function exibirModalError(conteudoErro) {
  document.getElementById("modalErro").classList.remove("hide-element");
  document.getElementById("modalErroOverlay").classList.remove("hide-element");
  document.getElementById("conteudoModalErro").appendChild(conteudoErro);

  if (!$("#voucherMessage").hasClass("hide-element")) {
    $("#voucherMessage").addClass("hide-element");
  }
}

// FIM FUNCOES MODAL DE ERRO

window.addEventListener("DOMContentLoaded", () => {
  carregarOticasNoDropdown();
});

document.getElementById("otica").addEventListener("change", function (event) {
  deletarFilhosDoElemento("local");
  carregarEnderecosNoDropdown(event.target.value);
});
// enviar para o formulario

function getFormData() {
  const name = document.getElementById('name').value;
  const contato = document.getElementById('contato').value;
  const date = document.getElementById('date').value;
  const time = document.getElementById('time').value;
  const otica = document.getElementById('otica').value;
  const local = document.getElementById('local').value;
  const nomeOperador = document.getElementById('nomeOperador').value;
  const idOperador = document.getElementById('idOperador').value;
  const Patologia = document.getElementById('Patologia').value;
  const Atendimento = document.getElementById('Atendimento').value;

  return {
      name,
      contato,
      date,
      time,
      otica,
      local,
      nomeOperador,
      idOperador,
      Patologia,
      Atendimento


  };
}
// Adicione esta função para enviar os dados para o formulário SheetMonkey


  function sendFormData(formData) {
    // Verifique se todos os campos estão preenchidos
    if (
      formData.name &&
      formData.contato &&
      formData.date &&
      formData.time &&
      formData.otica &&
      formData.local &&
      formData.nomeOperador &&
      formData.idOperador &&
      formData.Patologia
    ) {
      // Todos os campos estão preenchidos, então envie os dados para a API
      fetch('https://api.sheetmonkey.io/form/xt1iwtz6d1yhEftctzVoPU', {
        method: 'post',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })
        .then(response => response.json())
        .then(data => {
          // Manipule a resposta aqui, se necessário
          console.log('Resposta do servidor:', data);
        })
        .catch(error => {
          // Manipule erros aqui, se necessário
          console.error('Erro ao enviar dados:', error);
        });
    } else {
      // Alguns campos estão vazios, exiba uma mensagem de erro
      console.error('Erro: Preencha todos os campos antes de enviar os dados.');
    }
  };

  