import { injectJsError } from './lib/jsError'
import { injectXHR } from './lib/xhr'
import { injectBlankScreen } from './lib/blankScreen'
import { injectTiming } from './lib/timing'
import { injectPV } from './lib/pv'
import { injectResidentTime } from './lib/residentTime'
import { injectVueError } from './lib/vueError'
injectJsError()
injectXHR()
injectBlankScreen()
injectResidentTime()
injectPV()
injectTiming()
