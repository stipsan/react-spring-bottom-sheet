## [3.4.1](https://github.com/stipsan/react-spring-bottom-sheet/compare/v3.4.0...v3.4.1) (2022-06-01)


### Bug Fixes

* add 18 to react peer dep ([d89c0bb](https://github.com/stipsan/react-spring-bottom-sheet/commit/d89c0bbbd28e89bfc9aaf5136c83b6f254d2430b))

# [3.4.0](https://github.com/stipsan/react-spring-bottom-sheet/compare/v3.3.0...v3.4.0) (2021-06-23)


### Features

* expand on content drag ([#141](https://github.com/stipsan/react-spring-bottom-sheet/issues/141)) ([ec733a5](https://github.com/stipsan/react-spring-bottom-sheet/commit/ec733a5a64ce5324946305bc9616749fea81ddbd))

# [3.3.0](https://github.com/stipsan/react-spring-bottom-sheet/compare/v3.2.1...v3.3.0) (2021-06-15)


### Features

* allow the developer to disable focus trap ([#138](https://github.com/stipsan/react-spring-bottom-sheet/issues/138)) ([ef176b3](https://github.com/stipsan/react-spring-bottom-sheet/commit/ef176b365426ed6fa5f14277f76df4dbb04b55db))

## [3.2.1](https://github.com/stipsan/react-spring-bottom-sheet/compare/v3.2.0...v3.2.1) (2021-01-26)


### Bug Fixes

* **deps:** update dependency @reach/portal to ^0.13.0 ([#94](https://github.com/stipsan/react-spring-bottom-sheet/issues/94)) ([1cc8056](https://github.com/stipsan/react-spring-bottom-sheet/commit/1cc8056624d201414c81c8ee7c01b827064eecee))

# [3.2.0](https://github.com/stipsan/react-spring-bottom-sheet/compare/v3.1.4...v3.2.0) (2021-01-21)


### Bug Fixes

* better velocity physics ([65390c7](https://github.com/stipsan/react-spring-bottom-sheet/commit/65390c7043aa15c415cb5b19bc2ea1799c6cf4fc))
* only animate on RESIZE if the source = element ([ceb3671](https://github.com/stipsan/react-spring-bottom-sheet/commit/ceb3671887409184924db814226a6355dd795dbe))
* use layout effect to prevent tearing on Safari ([6b62559](https://github.com/stipsan/react-spring-bottom-sheet/commit/6b62559218d83ac00bd035ae8dc4411aed6b7fb0))


### Features

* add height getter to ref ([51c8510](https://github.com/stipsan/react-spring-bottom-sheet/commit/51c8510d2f6b69476877fb549afba49aa5bda5de))
* add source to RESIZE events ([383e206](https://github.com/stipsan/react-spring-bottom-sheet/commit/383e2062594de202ae77c25ac2ed9ae1137bcb2b)), closes [#53](https://github.com/stipsan/react-spring-bottom-sheet/issues/53)
* override source and velocity in snapTo ([1afe79f](https://github.com/stipsan/react-spring-bottom-sheet/commit/1afe79f317086d0ab24869a3e312cb766a992c86))
* SNAP events now have `source` ([240c212](https://github.com/stipsan/react-spring-bottom-sheet/commit/240c21232c155e1c58e5b0526ab6f121706a5161)), closes [#87](https://github.com/stipsan/react-spring-bottom-sheet/issues/87)

## [3.1.4](https://github.com/stipsan/react-spring-bottom-sheet/compare/v3.1.3...v3.1.4) (2020-12-29)


### Bug Fixes

* improve TS definitions ([a8102bf](https://github.com/stipsan/react-spring-bottom-sheet/commit/a8102bfd35e13238e8f09f8edc2fa8ddfa90fe1a))

## [3.1.3](https://github.com/stipsan/react-spring-bottom-sheet/compare/v3.1.2...v3.1.3) (2020-12-29)


### Bug Fixes

* export prop types ts definitions ([36cf999](https://github.com/stipsan/react-spring-bottom-sheet/commit/36cf999bfd8d1a0564ba9770a401e09a8650c607))

## [3.1.2](https://github.com/stipsan/react-spring-bottom-sheet/compare/v3.1.1...v3.1.2) (2020-12-29)


### Bug Fixes

* avoid dividing by zero during prerender ([ca2b9ae](https://github.com/stipsan/react-spring-bottom-sheet/commit/ca2b9ae2b97d1b871976d34f6b128e9b0386932d))

## [3.1.1](https://github.com/stipsan/react-spring-bottom-sheet/compare/v3.1.0...v3.1.1) (2020-12-29)


### Bug Fixes

* iOS display cutouts caused a scrollbar in some cases ([45c182c](https://github.com/stipsan/react-spring-bottom-sheet/commit/45c182c1c360ad060a76c50fc3d167876de15317))

# [3.1.0](https://github.com/stipsan/react-spring-bottom-sheet/compare/v3.0.3...v3.1.0) (2020-12-29)


### Features

* add skipInitialTransition to make skipping opt-in ([f200ad0](https://github.com/stipsan/react-spring-bottom-sheet/commit/f200ad04440c34ce1391ebf7cafcf9ecee88e4ae))

## [3.0.3](https://github.com/stipsan/react-spring-bottom-sheet/compare/v3.0.2...v3.0.3) (2020-12-28)


### Bug Fixes

* xstate deprecation warning on null events ([e44e273](https://github.com/stipsan/react-spring-bottom-sheet/commit/e44e273ec2f560228084e2f688e247933f0fa232))

## [3.0.2](https://github.com/stipsan/react-spring-bottom-sheet/compare/v3.0.1...v3.0.2) (2020-12-28)


### Bug Fixes

* RESIZE should never animate the content opacity ([2470ccc](https://github.com/stipsan/react-spring-bottom-sheet/commit/2470cccb554ca9cf2efe343bdb8b8e4b836a3ae2))

## [3.0.1](https://github.com/stipsan/react-spring-bottom-sheet/compare/v3.0.0...v3.0.1) (2020-12-28)


### Bug Fixes

* filter out taps on drag ([bc709a0](https://github.com/stipsan/react-spring-bottom-sheet/commit/bc709a0becd45b37e8661ba530702e86626618b6))

# [3.0.0](https://github.com/stipsan/react-spring-bottom-sheet/compare/v2.3.0...v3.0.0) (2020-12-28)


### Bug Fixes

* remove padding wrappers ([#57](https://github.com/stipsan/react-spring-bottom-sheet/issues/57)) ([60657fb](https://github.com/stipsan/react-spring-bottom-sheet/commit/60657fbe752abbf07ee77264ad9e2aaff7a32db4))


### BREAKING CHANGES

* The resize observer logic is rewritten to no longer require wrapper elements like `[data-rsbs-footer-padding]`. If you're not using custom CSS and are simply importing `react-spring-bottom-sheet/dist/style.css` in your app then this isn't a breaking change for you.


If you're using custom CSS, here's the breaking changes:
- `[data-rsbs-header-padding]` removed, update selectors to `[data-rsbs-header]`
- `[data-rsbs-content-padding]` removed, update selectors to `[data-rsbs-scroll]`
- `[data-rsbs-footer-padding]` removed, update selectors to `[data-rsbs-footer]`
- `[data-rsbs-antigap]` removed, update selectors to `[data-rsbs-root]:after` and make sure to add `content: '';`.
- `[data-rsbs-content]` is changed, update selectors to `[data-rsbs-scroll]`.
- The `<div style="overflow:hidden;">` wrapper that used to be between `[data-rsbs-content]` and `[data-rsbs-content-padding]` is now within `[data-rsbs-scroll]`, and no longer hardcode `overflow: hidden`, add `[data-rsbs-content] { overflow: hidden; }` to your CSS.

# [2.3.0](https://github.com/stipsan/react-spring-bottom-sheet/compare/v2.2.7...v2.3.0) (2020-12-28)


### Features

* refactor to xstate ([#46](https://github.com/stipsan/react-spring-bottom-sheet/issues/46)) ([6b2f92a](https://github.com/stipsan/react-spring-bottom-sheet/commit/6b2f92ae5556026c3cf2496d7bbb3828996e0673))

## [2.2.7](https://github.com/stipsan/react-spring-bottom-sheet/compare/v2.2.6...v2.2.7) (2020-12-19)


### Bug Fixes

* dragging can overshoot if onDismiss is undefined ([#43](https://github.com/stipsan/react-spring-bottom-sheet/issues/43)) ([549ab30](https://github.com/stipsan/react-spring-bottom-sheet/commit/549ab30be66dd138fb59a9bf869eb77002349b6f))

## [2.2.6](https://github.com/stipsan/react-spring-bottom-sheet/compare/v2.2.5...v2.2.6) (2020-12-08)


### Bug Fixes

* better type declarations ([c19dd44](https://github.com/stipsan/react-spring-bottom-sheet/commit/c19dd446827dcb32cee664f84fea250beb86c1ff))

## [2.2.5](https://github.com/stipsan/react-spring-bottom-sheet/compare/v2.2.4...v2.2.5) (2020-12-08)


### Bug Fixes

* improve rubber band effect when out of bounds ([#29](https://github.com/stipsan/react-spring-bottom-sheet/issues/29)) ([4f2fe09](https://github.com/stipsan/react-spring-bottom-sheet/commit/4f2fe090774bcfbfd5171281701cc5ba68db8a44))

## [2.2.4](https://github.com/stipsan/react-spring-bottom-sheet/compare/v2.2.3...v2.2.4) (2020-12-07)


### Bug Fixes

* more stable defaultSnap RESIZE sync ([230dbe2](https://github.com/stipsan/react-spring-bottom-sheet/commit/230dbe2bf0d3fe0f0314e444e0b2154fe5d2295f))
* readjust defaultSnap on resize ([b812786](https://github.com/stipsan/react-spring-bottom-sheet/commit/b812786697d2a7c58ce87bf5106cbb524a59193d))

## [2.2.3](https://github.com/stipsan/react-spring-bottom-sheet/compare/v2.2.2...v2.2.3) (2020-12-07)


### Bug Fixes

* make open transitions more interruptible on iOS ([#23](https://github.com/stipsan/react-spring-bottom-sheet/issues/23)) ([f898dd0](https://github.com/stipsan/react-spring-bottom-sheet/commit/f898dd035fc0087237ec993789c40675c0dcd080))

## [2.2.2](https://github.com/stipsan/react-spring-bottom-sheet/compare/v2.2.1...v2.2.2) (2020-12-05)


### Bug Fixes

* updated readme with more API docs and examples ([6a48fab](https://github.com/stipsan/react-spring-bottom-sheet/commit/6a48fab13285d113921d2c45e7a96e00e12138f3))

## [2.2.1](https://github.com/stipsan/react-spring-bottom-sheet/compare/v2.2.0...v2.2.1) (2020-12-05)


### Bug Fixes

* rewrite interpolations to always be in frame sync ([cc43467](https://github.com/stipsan/react-spring-bottom-sheet/commit/cc43467062e212f121045bf377b752c64c337213))

# [2.2.0](https://github.com/stipsan/react-spring-bottom-sheet/compare/v2.1.0...v2.2.0) (2020-12-05)


### Features

* Add RESIZE events ([b3ff691](https://github.com/stipsan/react-spring-bottom-sheet/commit/b3ff691f6d893e56235e207864e63b61c8740750))

# [2.1.0](https://github.com/stipsan/react-spring-bottom-sheet/compare/v2.0.3...v2.1.0) (2020-12-05)


### Bug Fixes

* use rAF instead of timeout to schedule unmount ([7f3c018](https://github.com/stipsan/react-spring-bottom-sheet/commit/7f3c0181a001a78aaad0d5318dfe9f8af15c3d05))


### Features

* add sibling prop support ([767215b](https://github.com/stipsan/react-spring-bottom-sheet/commit/767215b60ea08dfabe90c4a7d5d5f2a85684064e))

## [2.0.3](https://github.com/stipsan/react-spring-bottom-sheet/compare/v2.0.2...v2.0.3) (2020-12-05)


### Bug Fixes

* add CSS sourcemap ([04bf99f](https://github.com/stipsan/react-spring-bottom-sheet/commit/04bf99f119f88cc49686b439cc3f31ec89b1041a))
* add keywords ([05f4399](https://github.com/stipsan/react-spring-bottom-sheet/commit/05f43990d6527b50c2a38d94cdebcacf02826e1e))
* add more NaN type guards ([7664d1a](https://github.com/stipsan/react-spring-bottom-sheet/commit/7664d1aad582f690554641ee841aae286865b60b))
* guard against NaN in minSnap and maxSnap handlers ([7dbf037](https://github.com/stipsan/react-spring-bottom-sheet/commit/7dbf0370afe33b2c93aa91f49f794fb3a30b5a48))
* TS in microbundle breaks on [...(new Set)], swapping to Array.from ([2402b5a](https://github.com/stipsan/react-spring-bottom-sheet/commit/2402b5adc6afa4759b6b3dd408b254b9d1693eeb))

## [2.0.2](https://github.com/stipsan/react-spring-bottom-sheet/compare/v2.0.1...v2.0.2) (2020-12-05)


### Bug Fixes

* microbundle defaults to preact, changed it back to react ([4f52355](https://github.com/stipsan/react-spring-bottom-sheet/commit/4f523558f1190b659a175f82ae5a0267a25d13eb))

## [2.0.1](https://github.com/stipsan/react-spring-bottom-sheet/compare/v2.0.0...v2.0.1) (2020-12-05)


### Bug Fixes

* **deps:** bump focus-trap ([a099a54](https://github.com/stipsan/react-spring-bottom-sheet/commit/a099a54958828ae1e27b6de3608b41000ace23a6))

# [2.0.0](https://github.com/stipsan/react-spring-bottom-sheet/compare/v1.0.6...v2.0.0) (2020-12-04)


### Features

* V2 ([#17](https://github.com/stipsan/react-spring-bottom-sheet/issues/17)) ([8331800](https://github.com/stipsan/react-spring-bottom-sheet/commit/8331800f0b1e95fa495a408bdddf02c3fc8c9d83))


### BREAKING CHANGES

* this is the real initial release, `v1` is fake software.

## [1.0.6](https://github.com/stipsan/react-spring-bottom-sheet/compare/v1.0.5...v1.0.6) (2020-12-04)


### Bug Fixes

* fade out correctly on snap ([17234bc](https://github.com/stipsan/react-spring-bottom-sheet/commit/17234bc2aebd18122c4dd324ff5ad17096486983))

## [1.0.5](https://github.com/stipsan/react-spring-bottom-sheet/compare/v1.0.4...v1.0.5) (2020-12-03)


### Bug Fixes

* update readme ([ceb55d3](https://github.com/stipsan/react-spring-bottom-sheet/commit/ceb55d34bea9892e7fc25e063b69dd4e2d155d77))

## [1.0.4](https://github.com/stipsan/react-spring-bottom-sheet/compare/v1.0.3...v1.0.4) (2020-12-03)


### Bug Fixes

* v2 api ready, just need to clean up and write docs ([96f158e](https://github.com/stipsan/react-spring-bottom-sheet/commit/96f158e6167e997a02e6a57f0b9395c47f0265fa))

## [1.0.3](https://github.com/stipsan/react-spring-bottom-sheet/compare/v1.0.2...v1.0.3) (2020-12-02)


### Bug Fixes

* **deps:** update dependency focus-trap to v6.2.2 ([9f79d35](https://github.com/stipsan/react-spring-bottom-sheet/commit/9f79d354e4bee3ffb8bb58c220cd59744472b778))

## [1.0.2](https://github.com/stipsan/react-spring-bottom-sheet/compare/v1.0.1...v1.0.2) (2020-12-01)


### Bug Fixes

* API cleanup ([dc2b126](https://github.com/stipsan/react-spring-bottom-sheet/commit/dc2b12641b5b1dd91599dd1d0724708d1e31f805))

## [1.0.1](https://github.com/stipsan/react-spring-bottom-sheet/compare/v1.0.0...v1.0.1) (2020-11-30)


### Bug Fixes

* doh, semantic release pushed v1.0 instead of v0.2 :( ([a5837bd](https://github.com/stipsan/react-spring-bottom-sheet/commit/a5837bd5ae099a5471fd68ca7c52b42fcc186a5e))

# 1.0.0 (2020-11-30)


### Features

* initial version ([ef3ecfa](https://github.com/stipsan/react-spring-bottom-sheet/commit/ef3ecfacab7246c2d8904db189740991f2947727))
