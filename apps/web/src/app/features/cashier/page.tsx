"use client";

import {
  Box,
  Button,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { trpc } from "@/utils/trpc";
import DashboardLayout from "../../(dashboard)/layout";

export default function CashierPage() {
  const [patientId, setPatientId] = useState("");
  const [charges, setCharges] = useState("");
  const [item, setItem] = useState("");
  const [paymentType, setPaymentType] = useState("");

  //Passed data most of it should be handle by the doctor check on it
  const patients = [];
  const items = [];
  const paymentTypes = [
    { id: "frontdesk", label: "Frontdesk (Cash/Mobile/Bank)" },
    { id: "insurance", label: "Insurance" },
  ];

  const createInvoice = trpc.billing.createInvoice.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    createInvoice.mutate({
      patientId,
      amount: Number(charges),
      paymentType: [paymentType],
      // If you want to include item, add it to your backend schema and mutation
      // item,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Box
          component="form"
          className="space-y-4"
          onSubmit={handleSubmit}
          sx={{
            maxWidth: 400,
            mx: "auto",
            p: 3,
            borderRadius: 2,
            boxShadow: 2,
            bgcolor: "background.paper",
          }}
        >
          <div>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Patient
            </Typography>
            <Select
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              required
              displayEmpty
              fullWidth
            >
              <MenuItem value="" disabled>
                Select patient
              </MenuItem>
              {patients.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name}
                </MenuItem>
              ))}
            </Select>
          </div>
          <div>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Charges
            </Typography>
            <TextField
              type="number"
              value={charges}
              onChange={(e) => setCharges(e.target.value)}
              placeholder="Enter charges"
              required
              fullWidth
            />
          </div>
          <div>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Item Bought
            </Typography>
            <Select
              value={item}
              onChange={(e) => setItem(e.target.value)}
              required
              displayEmpty
              fullWidth
            >
              <MenuItem value="" disabled>
                Select item
              </MenuItem>
              {items.map((i) => (
                <MenuItem key={i.id} value={i.id}>
                  {i.label}
                </MenuItem>
              ))}
            </Select>
          </div>
          <div>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Payment Type
            </Typography>
            <Select
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value)}
              required
              displayEmpty
              fullWidth
            >
              <MenuItem value="" disabled>
                Select payment type
              </MenuItem>
              {paymentTypes.map((pt) => (
                <MenuItem key={pt.id} value={pt.id}>
                  {pt.label}
                </MenuItem>
              ))}
            </Select>
          </div>
          <Button type="submit" variant="contained" fullWidth>
            Confirm Payment
          </Button>
        </Box>
      </div>
    </DashboardLayout>
  );
}
