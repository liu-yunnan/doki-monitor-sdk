import { injectJsError } from './lib/jsError'
import { injectXHR } from './lib/xhr'
import { blankScreen } from './lib/blankScreen'
import { timing } from './lib/timing'
import { pv } from './lib/pv'
import { getResidentTime } from './lib/residentTime'
injectJsError()
injectXHR()
blankScreen()
timing()
pv()
getResidentTime()