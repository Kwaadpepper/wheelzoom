__whmodules = {
  globals: {},
  modules: [],
  add: (_module) -> __whmodules.modules.push _module.bind __whmodules.globals
  addClass: (_className, _class) ->
    __whmodules.globals[_className] = _class.bind __whmodules.globals
  windowRegister: (_globalElement) -> _globalElement()
  init: -> _module.call(__whmodules.globals) for _module in __whmodules.modules
}
