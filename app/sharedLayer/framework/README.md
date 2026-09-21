# framework

The only place of the UI layers that may import the framework (`next/*`, `next-auth/*`, `next-i18n-router`,
`next-cloudinary`). Everything else imports these wrappers, the rule is enforced by ESLint.

The wrappers expose small interfaces of their own, not the types of the framework. Moving the front end
to another framework means rewriting the files of this folder and the entry files in `app/(pages)`.
