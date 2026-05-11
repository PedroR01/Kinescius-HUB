import { useForm } from "react-hook-form";
import { z } from "zod/v3";
import { zodResolver } from "@hookform/resolvers/zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, { message: "La contraseña debe tener al menos 8 caracteres" })
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = (values: LoginFormValues) => {
    console.log(values);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <input {...register("email")} placeholder="Email" className="border p-2 w-full" />
      {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}

      <input
        type="password"
        {...register("password")}
        placeholder="Password"
        className="border p-2 w-full"
      />
      {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}

      <button type="submit" className="px-4 py-2 rounded bg-black text-white">
        Ingresar
      </button>
    </form>
  );
}
