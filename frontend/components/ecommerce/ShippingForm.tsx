import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormContext } from "react-hook-form";

export function ShippingForm() {
    const { register, formState: { errors } } = useFormContext();

    return (
        <div className="grid gap-4 py-4">
            <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                    id="name"
                    placeholder="Jane Doe"
                    {...register("shipping.name", { required: "Name is required" })}
                />
                {errors.shipping?.name && <p className="text-red-500 text-xs">{(errors.shipping.name as any).message}</p>}
            </div>

            <div className="grid gap-2">
                <Label htmlFor="address1">Address Line 1</Label>
                <Input
                    id="address1"
                    placeholder="123 Main St"
                    {...register("shipping.address.line1", { required: "Address is required" })}
                />
                {errors.shipping?.address?.line1 && <p className="text-red-500 text-xs">{(errors.shipping.address.line1 as any).message}</p>}
            </div>

            <div className="grid gap-2">
                <Label htmlFor="address2">Address Line 2 (Optional)</Label>
                <Input
                    id="address2"
                    placeholder="Apt 4B"
                    {...register("shipping.address.line2")}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                        id="city"
                        placeholder="New York"
                        {...register("shipping.address.city", { required: "City is required" })}
                    />
                    {errors.shipping?.address?.city && <p className="text-red-500 text-xs">{(errors.shipping.address.city as any).message}</p>}
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                        id="state"
                        placeholder="NY"
                        {...register("shipping.address.state", { required: "State is required" })}
                    />
                    {errors.shipping?.address?.state && <p className="text-red-500 text-xs">{(errors.shipping.address.state as any).message}</p>}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="zip">ZIP / Postal Code</Label>
                    <Input
                        id="zip"
                        placeholder="10001"
                        {...register("shipping.address.postal_code", { required: "ZIP is required" })}
                    />
                    {errors.shipping?.address?.postal_code && <p className="text-red-500 text-xs">{(errors.shipping.address.postal_code as any).message}</p>}
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="country">Country Code</Label>
                    <Input
                        id="country"
                        placeholder="US"
                        maxLength={2}
                        {...register("shipping.address.country", {
                            required: "Country is required",
                            minLength: { value: 2, message: "Use 2-letter code (e.g. US)" },
                            maxLength: { value: 2, message: "Use 2-letter code (e.g. US)" },
                        })}
                    />
                    {errors.shipping?.address?.country && <p className="text-red-500 text-xs">{(errors.shipping.address.country as any).message}</p>}
                </div>
            </div>
        </div>
    );
}
