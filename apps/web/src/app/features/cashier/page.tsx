"use client";

import { RouteGuard } from "@/app/auth/components/route-guard";
import DashboardLayout from "../../(dashboard)/layout";
import { CashierForm } from "./_components/cashier-form";
import { InvoiceDetailsCard } from "./_components/invoice-details-card";
import { InvoicesTable } from "./_components/invoices-table";
import { useCashierData } from "./_hooks/use-cashier-data";
import { useCashierForm } from "./_hooks/use-cashier-form";
import { useInvoiceDetails } from "./_hooks/use-invoice-details";
import { useInvoicesList } from "./_hooks/use-invoices-list";
import { paymentTypes } from "./_utils/constants";

export default function CashierPage() {
  const { patients, items, isPatientsLoading, isItemsLoading, loadError } =
    useCashierData();

  const {
    patientId,
    charges,
    item,
    paymentType,
    errors,
    isSubmitting,
    setPatientId,
    setCharges,
    setItem,
    setPaymentType,
    submit,
  } = useCashierForm();

  const {
    invoices,
    isLoading: isInvoicesLoading,
    isFetching: isInvoicesFetching,
    isExporting: isInvoicesExporting,
    error: invoicesError,
    search,
    fromDate,
    toDate,
    onSearchChange,
    onFromDateChange,
    onToDateChange,
    selectedInvoiceId,
    setSelectedInvoiceId,
    onDownload,
    pagination,
  } = useInvoicesList();

  const {
    invoice: selectedInvoice,
    isLoading: isInvoiceDetailsLoading,
    error: invoiceDetailsError,
  } = useInvoiceDetails({
    invoiceId: selectedInvoiceId,
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    submit();
  };

  return (
    <DashboardLayout>
      <RouteGuard required="billing:create_invoice">
        <div className="space-y-6">
          <CashierForm
            patients={patients}
            items={items}
            paymentTypes={paymentTypes}
            patientId={patientId}
            charges={charges}
            item={item}
            paymentType={paymentType}
            errors={errors}
            isPatientsLoading={isPatientsLoading}
            isItemsLoading={isItemsLoading}
            isSubmitting={isSubmitting}
            loadErrorMessage={
              loadError
                ? `Failed to load cashier data: ${loadError.message}`
                : undefined
            }
            onPatientChange={setPatientId}
            onChargesChange={setCharges}
            onItemChange={setItem}
            onPaymentTypeChange={setPaymentType}
            onSubmit={handleSubmit}
          />

          <RouteGuard required="billing:view_invoices" fallback={null}>
            <InvoicesTable
              invoices={invoices}
              isLoading={isInvoicesLoading}
              isFetching={isInvoicesFetching}
              isExporting={isInvoicesExporting}
              error={invoicesError}
              search={search}
              fromDate={fromDate}
              toDate={toDate}
              onSearchChange={onSearchChange}
              onFromDateChange={onFromDateChange}
              onToDateChange={onToDateChange}
              onDownload={onDownload}
              onViewDetails={setSelectedInvoiceId}
              pagination={pagination}
            />

            <InvoiceDetailsCard
              invoice={selectedInvoice}
              isLoading={isInvoiceDetailsLoading}
              errorMessage={
                invoiceDetailsError
                  ? `Failed to load invoice details: ${invoiceDetailsError.message}`
                  : undefined
              }
            />
          </RouteGuard>
        </div>
      </RouteGuard>
    </DashboardLayout>
  );
}
