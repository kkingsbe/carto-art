import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormContext, Controller } from "react-hook-form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { COUNTRIES, STATES } from "@/lib/constants/shipping";

export function ShippingForm() {
    const { register, control, watch, formState: { errors } } = useFormContext();

    const selectedCountry = watch("shipping.address.country");
    const hasStates = selectedCountry && STATES[selectedCountry];

    return (
        <div className="grid gap-4 py-4">
            <div className="grid gap-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    {...register("email", {
                        required: "Email is required",
                        pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: "Invalid email address"
                        }
                    })}
                />
                {errors.email && <p className="text-red-500 text-xs">{String(errors.email.message)}</p>}
            </div>
            <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                    id="name"
                    placeholder="Jane Doe"
                    {...register("shipping.name", { required: "Name is required" })}
                />
                {(errors.shipping as any)?.name && <p className="text-red-500 text-xs">{String((errors.shipping as any).name?.message)}</p>}
            </div>

            <div className="grid gap-2">
                <Label htmlFor="address1">Address Line 1</Label>
                <Input
                    id="address1"
                    placeholder="123 Main St"
                    {...register("shipping.address.line1", { required: "Address is required" })}
                />
                {(errors.shipping as any)?.address?.line1 && <p className="text-red-500 text-xs">{String((errors.shipping as any).address?.line1?.message)}</p>}
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
                    {(errors.shipping as any)?.address?.city && <p className="text-red-500 text-xs">{String((errors.shipping as any).address?.city?.message)}</p>}
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="state">{hasStates ? "State / Province" : "State / Region"}</Label>
                    {hasStates ? (
                        <Controller
                            name="shipping.address.state"
                            control={control}
                            rules={{ required: "State is required" }}
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger id="state">
                                        <SelectValue placeholder="Select state" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {STATES[selectedCountry].map((state) => (
                                            <SelectItem key={state.code} value={state.code}>
                                                {state.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    ) : (
                        <Input
                            id="state"
                            placeholder="NY"
                            {...register("shipping.address.state", { required: "State is required" })}
                        />
                    )}
                    {(errors.shipping as any)?.address?.state && <p className="text-red-500 text-xs">{String((errors.shipping as any).address?.state?.message)}</p>}
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
                    {(errors.shipping as any)?.address?.postal_code && <p className="text-red-500 text-xs">{String((errors.shipping as any).address?.postal_code?.message)}</p>}
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="country">Country</Label>
                    <Controller
                        name="shipping.address.country"
                        control={control}
                        rules={{ required: "Country is required" }}
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger id="country">
                                    <SelectValue placeholder="Select country" />
                                </SelectTrigger>
                                <SelectContent>
                                    {COUNTRIES.map((country) => (
                                        <SelectItem key={country.code} value={country.code}>
                                            {country.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    />
                    {(errors.shipping as any)?.address?.country && <p className="text-red-500 text-xs">{String((errors.shipping as any).address?.country?.message)}</p>}
                </div>
            </div>
        </div>
    );
}

