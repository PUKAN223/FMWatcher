import { NextResponse } from "next/server";
import { readTransactions, clearTransactions } from "@/lib/storage/store";

export async function GET() {
  const transactions = readTransactions();
  return NextResponse.json({
    success: true,
    count: transactions.length,
    transactions,
  });
}

export async function DELETE() {
  clearTransactions();
  return NextResponse.json({
    success: true,
    message: "Cleared all transactions",
    transactions: [],
  });
}
