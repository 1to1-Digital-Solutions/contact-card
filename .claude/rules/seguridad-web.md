---
paths:
  - "**/app/**"
  - "**/actions.ts"
  - "**/actions/**"
  - "**/route.ts"
  - "**/proxy.ts"
  - "**/lib/**"
---

# Seguridad de una app web (Next)

- **Una Server Action es un endpoint público**: cualquiera puede llamarla con lo que quiera.
  Dentro de la acción, valida la entrada con un esquema, autentica y **comprueba que ese usuario
  puede tocar ESE registro**. Igual en cada `route.ts`.
- Nada de spread de `req.json()` o de un `FormData` sin pasar por el esquema: deja escribir
  campos que nadie expuso (`role`, `user_id`, `__proto__`).
- **Ocultar en el JSX no es autorizar.** Quitar un botón no impide la llamada: decide el
  servidor, y la RLS es la última línea, no la única.
- Todo `NEXT_PUBLIC_*` acaba en el bundle del navegador: ningún secreto ahí.
- Un `href` con datos del usuario solo con `http:`, `https:` o `mailto:` (`javascript:` ejecuta).
- `dangerouslySetInnerHTML` solo con HTML saneado justo antes, nunca con datos crudos.
- Ni sesión ni tokens en `localStorage`: cookies `httpOnly`.
- En Next 16 el middleware es `proxy.ts` (exporta `proxy`); no lo renombres a `middleware.ts`.
