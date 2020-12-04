[![npm stat](https://img.shields.io/npm/dm/react-spring-bottom-sheet.svg?style=flat-square)](https://npm-stat.com/charts.html?package=react-spring-bottom-sheet)
[![npm version](https://img.shields.io/npm/v/react-spring-bottom-sheet.svg?style=flat-square)](https://www.npmjs.com/package/react-spring-bottom-sheet)
[![gzip size][gzip-badge]][unpkg-dist]
[![size][size-badge]][unpkg-dist]
[![module formats: cjs, es, and modern][module-formats-badge]][unpkg-dist]
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?style=flat-square)](https://github.com/semantic-release/semantic-release)

![Logo with the text Accessible, Delightful and Performant](https://react-spring-bottom-sheet.cocody.dev/readme.svg)

**react-spring-bottom-sheet** is built on top of **react-spring** and **react-use-gesture**. It busts the myth that accessibility and supporting keyboard navigation and screen readers are allegedly at odds with delightful, beautiful and highly animated UIs. Every animation and transition is implemented using CSS custom properties instead of manipulating them directly, allowing complete control over the experience from CSS alone.

## Install

```bash
npm i react-spring-bottom-sheet
```

# [Demos](https://react-spring-bottom-sheet.cocody.dev/)

## [Basic](https://react-spring-bottom-sheet.cocody.dev/fixtures/simple)

> [View demo code](/pages/fixtures/simple.tsx#L43-L47)

MVP example, showing what you get by implementing `open`, `onDismiss` and a single **snap point** always set to `minHeight`.

## [Snap points & overflow](https://react-spring-bottom-sheet.cocody.dev/fixtures/scrollable)

> [View demo code](/pages/fixtures/scrollable.tsx#L85-L95)

A more elaborate example that showcases how snap points work. It also shows how it behaves if you want it to be open by default, and not closable. Notice how it responds if you resize the window, or scroll to the bottom and starts adjusting the height of the sheet without scrolling back up first.

## [Sticky header & footer](https://react-spring-bottom-sheet.cocody.dev/fixtures/sticky)

> [View demo code](/pages/fixtures/sticky.tsx#L40-L60)

If you provide either a `header` or `footer` prop you'll enable the special behavior seen in this example. And they're not just sticky positioned, both areas support touch gestures.

## [Non-blocking overlay mode](https://react-spring-bottom-sheet.cocody.dev/fixtures/aside)

> [View demo code](/pages/fixtures/aside.tsx#L41-L46)

In most cases you use a bottom sheet the same way you do with a dialog: you want it to overlay the page and block out distractions. But there are times when you want a bottom sheet but without it taking all the attention and overlaying the entire page. Providing `blocking={false}` helps this use case. By doing so you disable a couple of behaviors that are there for accessibility (focus-locking and more) that prevents a screen reader or a keyboard user from accidentally leaving the bottom sheet.

# [Get started](/GET_STARTED.md)

# Credits

- Play icon used on frame overlays: https://fontawesome.com/icons/play-circle?style=regular
- Phone frame used in logo: https://www.figma.com/community/file/896042888090872154/Mono-Devices-1.0
- iPhone frame used to wrap examples: https://www.figma.com/community/file/858143367356468985/(Variants)-iOS-%26-iPadOS-14-UI-Kit-for-Figma

[gzip-badge]: http://img.badgesize.io/https://unpkg.com/react-spring-bottom-sheet/dist/index.es.js?compression=gzip&label=gzip%20size&style=flat-square
[size-badge]: http://img.badgesize.io/https://unpkg.com/react-spring-bottom-sheet/dist/index.es.js?label=size&style=flat-square
[unpkg-dist]: https://unpkg.com/react-spring-bottom-sheet/dist/
[module-formats-badge]: https://img.shields.io/badge/module%20formats-cjs%2C%20es%2C%20modern-green.svg?style=flat-square
