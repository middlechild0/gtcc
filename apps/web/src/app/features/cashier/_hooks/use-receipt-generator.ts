"use client";

import { useState } from "react";
import { trpc } from "@/trpc/client";

export function useReceiptGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateReceiptQuery = trpc.billing.generateReceipt.useQuery;

  const openReceiptPreview = (invoiceId: string) => {
    const width = 900;
    const height = 800;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const receiptWindow = window.open(
      "",
      "receipt",
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`,
    );

    if (!receiptWindow) {
      alert("Please allow pop-ups to view the receipt");
      return;
    }

    receiptWindow.document.write(
      "<html><body><h3>Loading receipt...</h3></body></html>",
    );

    // Fetch receipt HTML
    fetch(
      `/api/trpc/billing.generateReceipt?input=${encodeURIComponent(JSON.stringify({ invoiceId, format: "html" }))}`,
    )
      .then((res) => res.json())
      .then((data) => {
        if (data?.result?.data?.content) {
          receiptWindow.document.open();
          receiptWindow.document.write(data.result.data.content);
          receiptWindow.document.close();
        } else {
          receiptWindow.document.write(
            "<html><body><h3>Error loading receipt</h3></body></html>",
          );
        }
      })
      .catch((err) => {
        console.error("Failed to load receipt:", err);
        receiptWindow.document.write(
          "<html><body><h3>Error loading receipt</h3></body></html>",
        );
      });
  };

  const downloadReceiptPdf = async (invoiceId: string) => {
    try {
      setIsGenerating(true);

      const response = await fetch(
        `/api/trpc/billing.generateReceipt?input=${encodeURIComponent(JSON.stringify({ invoiceId, format: "html" }))}`,
      );

      const data = await response.json();

      if (!data?.result?.data?.content) {
        throw new Error("Failed to generate receipt");
      }

      // For PDF, we'll use the browser's print to PDF feature
      // Open the receipt in a new window and trigger print dialog
      const width = 900;
      const height = 800;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const printWindow = window.open(
        "",
        "print-receipt",
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`,
      );

      if (!printWindow) {
        alert("Please allow pop-ups to print the receipt");
        return;
      }

      printWindow.document.open();
      printWindow.document.write(data.result.data.content);
      printWindow.document.close();

      // Wait for content to load then trigger print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 250);
      };
    } catch (error) {
      console.error("Failed to download receipt:", error);
      alert("Failed to generate receipt. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    isGenerating,
    openReceiptPreview,
    downloadReceiptPdf,
  };
}
