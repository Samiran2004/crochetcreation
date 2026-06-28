'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface AddressFields {
  street_address: string;
  city: string;
  state: string;
  postal_code: string;
  latitude?: number;
  longitude?: number;
}

interface AddressMapPickerProps {
  onAddressSelect: (address: AddressFields) => void;
  initialAddress?: Partial<AddressFields>;
}

export default function AddressMapPicker({ onAddressSelect, initialAddress }: AddressMapPickerProps) {
  const [streetAddress, setStreetAddress] = useState(initialAddress?.street_address || '');
  const [city, setCity] = useState(initialAddress?.city || '');
  const [state, setState] = useState(initialAddress?.state || '');
  const [postalCode, setPostalCode] = useState(initialAddress?.postal_code || '');

  // Notify parent form of changes
  const handleNotifyParent = useCallback((updatedFields: AddressFields) => {
    onAddressSelect(updatedFields);
  }, [onAddressSelect]);

  // Synchronize internal state when initialAddress prop changes (e.g. from selecting saved address)
  useEffect(() => {
    if (initialAddress) {
      setStreetAddress(initialAddress.street_address || '');
      setCity(initialAddress.city || '');
      setState(initialAddress.state || '');
      setPostalCode(initialAddress.postal_code || '');
    }
  }, [initialAddress]);

  return (
    <div className="space-y-4 font-sans text-stone-800">
      {/* Editable fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        <div className="space-y-1">
          <label className="text-[9px] font-bold uppercase tracking-widest text-stone-400">Street / Road Address</label>
          <input
            type="text"
            required
            placeholder="e.g. 12 Baker Street"
            value={streetAddress}
            onChange={(e) => {
              setStreetAddress(e.target.value);
              handleNotifyParent({ street_address: e.target.value, city, state, postal_code: postalCode });
            }}
            className="w-full bg-[#FEF9F6] border border-[#EADBDB] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#6B5656] focus:bg-white transition-all shadow-2xs text-stone-850"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[9px] font-bold uppercase tracking-widest text-stone-400">City</label>
          <input
            type="text"
            required
            placeholder="e.g. Kolkata"
            value={city}
            onChange={(e) => {
              setCity(e.target.value);
              handleNotifyParent({ street_address: streetAddress, city: e.target.value, state, postal_code: postalCode });
            }}
            className="w-full bg-[#FEF9F6] border border-[#EADBDB] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#6B5656] focus:bg-white transition-all shadow-2xs text-stone-850"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[9px] font-bold uppercase tracking-widest text-stone-400">State</label>
          <input
            type="text"
            required
            placeholder="e.g. West Bengal"
            value={state}
            onChange={(e) => {
              setState(e.target.value);
              handleNotifyParent({ street_address: streetAddress, city, state: e.target.value, postal_code: postalCode });
            }}
            className="w-full bg-[#FEF9F6] border border-[#EADBDB] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#6B5656] focus:bg-white transition-all shadow-2xs text-stone-850"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[9px] font-bold uppercase tracking-widest text-stone-400">Pincode / ZIP Code</label>
          <input
            type="text"
            required
            placeholder="e.g. 700001"
            value={postalCode}
            onChange={(e) => {
              setPostalCode(e.target.value);
              handleNotifyParent({ street_address: streetAddress, city, state, postal_code: e.target.value });
            }}
            className="w-full bg-[#FEF9F6] border border-[#EADBDB] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#6B5656] focus:bg-white transition-all shadow-2xs text-stone-850"
          />
        </div>
      </div>
    </div>
  );
}
