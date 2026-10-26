<?php

namespace App\Services;

/**
 * Lê e valida uma planilha de vendas (lançadas como vendas já fechadas).
 *
 * Colunas: Data | Cliente | Valor | Pagamento.
 * Pagamento aceita Dinheiro, Pix, Crédito, Débito ou Pendente (e variações
 * como "cartão de crédito"); em branco, usa a forma padrão informada.
 */
class SalesImport extends PlanilhaImport
{
    /** Rótulo exibido para cada forma de pagamento do sistema. */
    public const PAGAMENTOS = [
        'dinheiro' => 'Dinheiro',
        'pix'      => 'Pix',
        'credito'  => 'Crédito',
        'debito'   => 'Débito',
        'pendente' => 'Pendente',
    ];

    /** Variações aceitas na planilha (já normalizadas: minúsculas, sem acento). */
    private const SINONIMOS = [
        'dinheiro' => ['dinheiro', 'especie', 'em especie', 'cash'],
        'pix'      => ['pix'],
        'credito'  => ['credito', 'cartao de credito', 'cartao credito', 'credit'],
        'debito'   => ['debito', 'cartao de debito', 'cartao debito', 'debit'],
        'pendente' => ['pendente', 'fiado', 'a receber', 'nao pago'],
    ];

    public function __construct(private ?string $pagamentoPadrao = null)
    {
    }

    protected function colunas(): array
    {
        return [
            'data'      => ['data', 'date', 'data da venda'],
            'cliente'   => ['cliente', 'customer', 'customer_name', 'nome'],
            'valor'     => ['valor', 'amount', 'total', 'valor (r$)'],
            'pagamento' => ['pagamento', 'forma de pagamento', 'payment', 'payment_method'],
        ];
    }

    protected function colunasObrigatorias(): array
    {
        return ['data', 'valor'];
    }

    protected function validarLinha(int $linha, array $valores): array
    {
        $data = $this->converterData($valores['data']);
        $valor = $this->converterValor($valores['valor']);
        $erros = $this->errosDataEValor($data, $valor);

        $cliente = trim((string) $valores['cliente']);
        if (mb_strlen($cliente) > 100) {
            $erros[] = 'Nome do cliente com mais de 100 caracteres.';
        }

        [$pagamento, $erroPagamento] = $this->resolverPagamento($valores['pagamento']);
        if ($erroPagamento) {
            $erros[] = $erroPagamento;
        }

        return [
            'line'           => $linha,
            'date'           => $data,
            'customer_name'  => $cliente !== '' ? $cliente : 'Cliente',
            'amount'         => $valor,
            'payment_method' => $pagamento,
            'payment_label'  => $pagamento ? self::PAGAMENTOS[$pagamento] : null,
            'errors'         => $erros,
        ];
    }

    /**
     * @return array{0:?string, 1:?string} [forma, erro]
     */
    private function resolverPagamento(mixed $valor): array
    {
        $texto = $this->normalizar((string) $valor);

        if ($texto === '') {
            return $this->pagamentoPadrao
                ? [$this->pagamentoPadrao, null]
                : [null, 'Forma de pagamento em branco (escolha uma forma padrão).'];
        }

        foreach (self::SINONIMOS as $forma => $variacoes) {
            if (in_array($texto, $variacoes, true)) {
                return [$forma, null];
            }
        }

        return [null, 'Forma de pagamento "' . trim((string) $valor) . '" não reconhecida (use Dinheiro, Pix, Crédito, Débito ou Pendente).'];
    }
}
