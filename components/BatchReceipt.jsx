import { buildBatchReceipt } from "@/lib/batchReceipt";

function ReceiptLine({ title, detail, amount }) {
  return (
    <div className="flex items-baseline justify-between gap-2 px-2 py-1.5 text-xs font-semibold">
      <span className="min-w-0 shrink truncate">{title}</span>
      <span className="min-w-0 flex-1 truncate text-right font-mono text-[10px] text-nv-ink/50">
        {detail}
      </span>
      {amount ? (
        <span className="shrink-0 text-right font-mono">{amount}</span>
      ) : null}
    </div>
  );
}

function ReceiptTitle({ children }) {
  return <p className="px-2 py-1.5 text-xs font-semibold">{children}</p>;
}

export default function BatchReceipt({ components, quantity, unitSell, projectedCost }) {
  const receipt = buildBatchReceipt({
    components,
    quantity,
    unitSell,
    projectedCost,
  });

  return (
    <div>
      <ReceiptTitle>Buy materials</ReceiptTitle>
      {receipt.materialLines.length > 0 ? (
        receipt.materialLines.map((line) => (
          <ReceiptLine
            key={line.key}
            title={line.title}
            detail={line.detail}
            amount={line.amount}
          />
        ))
      ) : (
        <ReceiptLine title="No buy materials" detail="" amount="" />
      )}
      <div className="border-t border-black">
        <ReceiptLine
          title={receipt.materialCost.title}
          detail={receipt.materialCost.detail}
          amount={receipt.materialCost.amount}
        />
      </div>

      <div className="mt-3">
        <ReceiptTitle>Revenue</ReceiptTitle>
        {receipt.revenueMessage ? (
          <ReceiptLine title={receipt.revenueMessage} detail="" amount="" />
        ) : (
          <>
            <ReceiptLine
              title={receipt.sellLine.title}
              detail={receipt.sellLine.detail}
              amount={receipt.sellLine.amount}
            />
            <ReceiptLine
              title={receipt.materialDeduction.title}
              detail={receipt.materialDeduction.detail}
              amount={receipt.materialDeduction.amount}
            />
            <div className="border-t-4 border-double border-black">
              <ReceiptLine
                title={receipt.profit.title}
                detail={receipt.profit.detail}
                amount={receipt.profit.amount}
              />
            </div>
            <ReceiptLine
              title={receipt.margin.title}
              detail={receipt.margin.detail}
              amount={receipt.margin.amount}
            />
          </>
        )}
      </div>
    </div>
  );
}
