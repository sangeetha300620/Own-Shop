"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  ImagePlus,
  ListChecks,
  MapPin,
  Ruler,
  Upload,
  Wallet,
  X,
} from "lucide-react";
import { api, ApiError, resolveImageUrl } from "@/lib/api";
import { LISTING_TYPES } from "@/lib/format";
import { useToast } from "@/components/ui/Toast";
import type {
  Amenity,
  City,
  FurnishingStatus,
  ListingType,
  Locality,
  PropertyDetail,
  PropertyFormData,
  PropertyImage,
  ShopCategory,
} from "@/lib/types";

const FURNISHING_OPTIONS: FurnishingStatus[] = ["UNFURNISHED", "SEMI_FURNISHED", "FULLY_FURNISHED"];

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-gray-50 disabled:text-gray-400";

const STEPS = [
  { key: "basics", label: "Basics", icon: ClipboardList },
  { key: "location", label: "Location", icon: MapPin },
  { key: "pricing", label: "Pricing", icon: Wallet },
  { key: "specs", label: "Specs", icon: Ruler },
  { key: "amenities", label: "Amenities", icon: ListChecks },
  { key: "photos", label: "Photos", icon: ImagePlus },
] as const;

const emptyForm: PropertyFormData = {
  title: "",
  description: "",
  listing_type: "RENT",
  category_id: 0,
  city_id: 0,
  locality_id: null,
  address_line: "",
  pincode: "",
  carpet_area_sqft: null,
  built_up_area_sqft: null,
  price: 0,
  security_deposit: null,
  maintenance_charge: null,
  lease_duration_years: null,
  floor_number: null,
  total_floors: null,
  furnishing_status: "UNFURNISHED",
  frontage_width_ft: null,
  is_corner_property: false,
  amenity_ids: [],
};

export default function PropertyForm({ existing }: { existing?: PropertyDetail }) {
  const router = useRouter();
  const toast = useToast();

  const [step, setStep] = useState(0);
  const [justAdvanced, setJustAdvanced] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [localities, setLocalities] = useState<Locality[]>([]);
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [form, setForm] = useState<PropertyFormData>(emptyForm);
  const [imageFiles, setImageFiles] = useState<FileList | null>(null);
  const [existingImages, setExistingImages] = useState<PropertyImage[]>(existing?.images ?? []);
  const [deletingImageId, setDeletingImageId] = useState<number | null>(null);
  const [stepError, setStepError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<City[]>("/cities").then(setCities).catch(() => {});
    api.get<ShopCategory[]>("/categories").then(setCategories).catch(() => {});
    api.get<Amenity[]>("/amenities").then(setAmenities).catch(() => {});
  }, []);

  useEffect(() => {
    if (existing) {
      setForm({
        title: existing.title,
        description: existing.description ?? "",
        listing_type: existing.listing_type,
        category_id: existing.category.id,
        city_id: existing.city.id,
        locality_id: existing.locality?.id ?? null,
        address_line: existing.address_line ?? "",
        pincode: existing.pincode ?? "",
        carpet_area_sqft: existing.carpet_area_sqft,
        built_up_area_sqft: existing.built_up_area_sqft,
        price: existing.price,
        security_deposit: existing.security_deposit,
        maintenance_charge: existing.maintenance_charge,
        lease_duration_years: existing.lease_duration_years,
        floor_number: existing.floor_number,
        total_floors: existing.total_floors,
        furnishing_status: existing.furnishing_status,
        frontage_width_ft: existing.frontage_width_ft,
        is_corner_property: existing.is_corner_property,
        amenity_ids: existing.amenities.map((a) => a.id),
      });
      setExistingImages(existing.images);
    }
  }, [existing]);

  useEffect(() => {
    if (!form.city_id) {
      setLocalities([]);
      return;
    }
    api
      .get<Locality[]>(`/cities/${form.city_id}/localities`)
      .then(setLocalities)
      .catch(() => setLocalities([]));
  }, [form.city_id]);

  function update<K extends keyof PropertyFormData>(key: K, value: PropertyFormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function removeExistingImage(imageId: number) {
    if (!existing) return;
    setDeletingImageId(imageId);
    try {
      await api.del(`/properties/${existing.id}/images/${imageId}`, true);
      setExistingImages((imgs) => imgs.filter((img) => img.id !== imageId));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to remove photo");
    } finally {
      setDeletingImageId(null);
    }
  }

  function toggleAmenity(id: number) {
    setForm((f) => ({
      ...f,
      amenity_ids: f.amenity_ids.includes(id)
        ? f.amenity_ids.filter((a) => a !== id)
        : [...f.amenity_ids, id],
    }));
  }

  function validateStep(index: number): string {
    if (index === 0 && (!form.title.trim() || !form.category_id)) {
      return "Please add a title and select a shop category.";
    }
    if (index === 1 && !form.city_id) {
      return "Please select a city.";
    }
    if (index === 2 && (!form.price || form.price <= 0)) {
      return "Please enter a valid price.";
    }
    return "";
  }

  // Briefly disables the Next/Publish button right after a step change.
  // Without this, clicking "Next" on the second-to-last step instantly
  // swaps that same button into "Publish listing" (the last step's submit
  // button) in the same screen position — a fast second click (very easy
  // to do when clicking through a wizard) would land on Publish before the
  // user has had any chance to interact with the new step, e.g. submitting
  // before they could pick a photo on the Photos step.
  function guardAgainstDoubleClick() {
    setJustAdvanced(true);
    setTimeout(() => setJustAdvanced(false), 450);
  }

  function goNext() {
    const err = validateStep(step);
    if (err) {
      setStepError(err);
      return;
    }
    setStepError("");
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    guardAgainstDoubleClick();
  }

  function goBack() {
    setStepError("");
    setStep((s) => Math.max(s - 1, 0));
  }

  function goToStep(index: number) {
    if (index <= step) {
      setStepError("");
      setStep(index);
      return;
    }
    for (let i = 0; i < index; i++) {
      const err = validateStep(i);
      if (err) {
        setStepError(err);
        setStep(i);
        return;
      }
    }
    setStepError("");
    setStep(index);
    guardAgainstDoubleClick();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    for (let i = 0; i <= 2; i++) {
      const err = validateStep(i);
      if (err) {
        setStepError(err);
        setStep(i);
        return;
      }
    }

    setSaving(true);
    setStepError("");
    try {
      const payload = {
        ...form,
        address_line: form.address_line || null,
        pincode: form.pincode || null,
        description: form.description || null,
      };

      let propertyId: number;
      if (existing) {
        await api.put(`/properties/${existing.id}`, payload, true);
        propertyId = existing.id;
      } else {
        const created = await api.post<{ id: number }>("/properties", payload, true);
        propertyId = created.id;
      }

      if (imageFiles && imageFiles.length > 0) {
        const formData = new FormData();
        Array.from(imageFiles).forEach((file) => formData.append("files", file));
        await api.upload(`/properties/${propertyId}/images`, formData);
      }

      toast.success(existing ? "Listing updated." : "Shop listed successfully!");
      router.push(`/properties/${propertyId}`);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Something went wrong";
      setStepError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  const isLastStep = step === STEPS.length - 1;

  return (
    <form onSubmit={handleSubmit}>
      {/* Stepper */}
      <div className="mb-8 flex items-center justify-between overflow-x-auto pb-1">
        {STEPS.map((s, i) => (
          <div key={s.key} className="flex flex-1 items-center last:flex-none">
            <button
              type="button"
              onClick={() => goToStep(i)}
              className="flex flex-shrink-0 flex-col items-center gap-1.5"
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-bold transition ${
                  i < step
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : i === step
                    ? "border-indigo-600 bg-white text-indigo-600"
                    : "border-gray-200 bg-white text-gray-300"
                }`}
              >
                {i < step ? <Check className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
              </span>
              <span
                className={`hidden text-xs font-semibold sm:block ${
                  i <= step ? "text-gray-900" : "text-gray-400"
                }`}
              >
                {s.label}
              </span>
            </button>
            {i < STEPS.length - 1 && (
              <div className={`mx-2 h-0.5 flex-1 ${i < step ? "bg-indigo-600" : "bg-gray-200"}`} />
            )}
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-900">What are you listing?</h2>
            <div className="flex gap-2">
              {LISTING_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => update("listing_type", t.value as ListingType)}
                  className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                    form.listing_type === t.value
                      ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <Field label="Title">
              <input
                required
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                placeholder="e.g. Spacious retail shop near MG Road"
                className={inputClass}
              />
            </Field>
            <Field label="Description">
              <textarea
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                rows={4}
                placeholder="Describe the space, footfall, nearby landmarks..."
                className={inputClass}
              />
            </Field>
            <Field label="Shop category">
              <select
                required
                value={form.category_id || ""}
                onChange={(e) => update("category_id", Number(e.target.value))}
                className={inputClass}
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-900">Where is it located?</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="City">
                <select
                  required
                  value={form.city_id || ""}
                  onChange={(e) => update("city_id", Number(e.target.value))}
                  className={inputClass}
                >
                  <option value="">Select city</option>
                  {cities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Locality">
                <select
                  value={form.locality_id || ""}
                  onChange={(e) =>
                    update("locality_id", e.target.value ? Number(e.target.value) : null)
                  }
                  disabled={!form.city_id}
                  className={inputClass}
                >
                  <option value="">Select locality</option>
                  {localities.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Address line">
                <input
                  value={form.address_line}
                  onChange={(e) => update("address_line", e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Pincode">
                <input
                  value={form.pincode}
                  onChange={(e) => update("pincode", e.target.value)}
                  className={inputClass}
                />
              </Field>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-900">Pricing &amp; terms</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={form.listing_type === "SALE" ? "Sale price (₹)" : "Price (₹)"}>
                <input
                  required
                  type="number"
                  min={1}
                  value={form.price || ""}
                  onChange={(e) => update("price", Number(e.target.value))}
                  className={inputClass}
                />
              </Field>
              {form.listing_type !== "SALE" && (
                <Field label="Security deposit (₹)">
                  <NumberInput
                    value={form.security_deposit}
                    onChange={(v) => update("security_deposit", v)}
                  />
                </Field>
              )}
              <Field label="Maintenance charge (₹/month)">
                <NumberInput
                  value={form.maintenance_charge}
                  onChange={(v) => update("maintenance_charge", v)}
                />
              </Field>
              {form.listing_type === "LEASE" && (
                <Field label="Lease duration (years)">
                  <NumberInput
                    value={form.lease_duration_years}
                    onChange={(v) => update("lease_duration_years", v)}
                  />
                </Field>
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-900">Shop specifications</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Carpet area (sqft)">
                <NumberInput
                  value={form.carpet_area_sqft}
                  onChange={(v) => update("carpet_area_sqft", v)}
                />
              </Field>
              <Field label="Built-up area (sqft)">
                <NumberInput
                  value={form.built_up_area_sqft}
                  onChange={(v) => update("built_up_area_sqft", v)}
                />
              </Field>
              <Field label="Floor number">
                <NumberInput value={form.floor_number} onChange={(v) => update("floor_number", v)} />
              </Field>
              <Field label="Total floors in building">
                <NumberInput value={form.total_floors} onChange={(v) => update("total_floors", v)} />
              </Field>
              <Field label="Frontage width (ft)">
                <NumberInput
                  value={form.frontage_width_ft}
                  onChange={(v) => update("frontage_width_ft", v)}
                />
              </Field>
              <Field label="Furnishing">
                <select
                  value={form.furnishing_status}
                  onChange={(e) => update("furnishing_status", e.target.value as FurnishingStatus)}
                  className={inputClass}
                >
                  {FURNISHING_OPTIONS.map((f) => (
                    <option key={f} value={f}>
                      {f.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.is_corner_property}
                onChange={(e) => update("is_corner_property", e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              Corner property
            </label>
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 className="mb-1 font-semibold text-gray-900">Amenities</h2>
            <p className="mb-4 text-sm text-gray-500">Select everything this shop offers.</p>
            <div className="flex flex-wrap gap-2">
              {amenities.map((a) => {
                const selected = form.amenity_ids.includes(a.id);
                return (
                  <button
                    type="button"
                    key={a.id}
                    onClick={() => toggleAmenity(a.id)}
                    className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition ${
                      selected
                        ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {selected && <Check className="h-3.5 w-3.5" />}
                    {a.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 5 && (
          <div>
            <h2 className="mb-1 font-semibold text-gray-900">Photos</h2>
            <p className="mb-4 text-sm text-gray-500">
              Listings with photos get significantly more inquiries.
            </p>
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center transition hover:border-indigo-400 hover:bg-indigo-50/50">
              <Upload className="h-8 w-8 text-gray-400" strokeWidth={1.5} />
              <span className="text-sm font-semibold text-gray-700">
                Click to upload shop photos
              </span>
              <span className="text-xs text-gray-400">JPG, PNG or WEBP — up to 5MB each</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                onChange={(e) => setImageFiles(e.target.files)}
                className="hidden"
              />
            </label>
            {imageFiles && imageFiles.length > 0 && (
              <p className="mt-2 text-sm font-medium text-indigo-600">
                {imageFiles.length} photo{imageFiles.length > 1 ? "s" : ""} selected
              </p>
            )}
            {existing && existingImages.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-medium text-gray-500">Current photos</p>
                <div className="flex flex-wrap gap-2">
                  {existingImages.map((img) => (
                    <div key={img.id} className="group relative h-16 w-20">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={resolveImageUrl(img.image_url)}
                        alt=""
                        className="h-16 w-20 rounded-lg object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(img.id)}
                        disabled={deletingImageId === img.id}
                        aria-label="Remove photo"
                        className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gray-900 text-white shadow-sm transition hover:bg-red-600 disabled:opacity-50"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {stepError && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{stepError}</p>
        )}

        <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-5">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 0}
            className="flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-0"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>

          {isLastStep ? (
            <button
              type="submit"
              disabled={saving || justAdvanced}
              className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? "Saving…" : existing ? "Save changes" : "Publish listing"}
            </button>
          ) : (
            <button
              type="button"
              onClick={goNext}
              disabled={justAdvanced}
              className="flex items-center gap-1 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:opacity-50"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      {children}
    </div>
  );
}

function NumberInput({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <input
      type="number"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
      className={inputClass}
    />
  );
}
