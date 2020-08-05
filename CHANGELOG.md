# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Change log md file
- Support for drag touch event
- Support for pinch to zoom touch event
- Gulp build system
- Bootstrap modal demo

### Changed

- Better default arguments on some methods
- Convert code to coffeescipt

### Fixed

- Npm package build

## [1.2.4] - 2020-08-01

### Fixed

- ECMA Script 5 compatibility

### Added

- Fullscreen event change support to reset drag and zomm position
- Npm package release
- Github package realease

### Changed

- plugin release name to wheelzoom-revived

## [1.2.0] - 2020-07-30

### Added

- plugin site
- package.json

### Fixed

- loosing data references in setInterval, now bind to image.wz object

### Changed

- zoom function, Now supports zooming below canvas size, usefull for fullscreen mode
