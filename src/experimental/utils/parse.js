export const parseHex = (hexColor) => {
  const parser = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hexColor)
  if (parser) {
    return [
      parseInt(parser[1], 16) / 255.0,
      parseInt(parser[2], 16) / 255.0,
      parseInt(parser[3], 16) / 255.0,
    ]
  } else {
    throw new Error(`${hexColor} is not a valid hex color code`)
  }
}

export const parseNumberToHex = (num) => {
  const c = num * 255.0
  const hex = c.toString(16)
  return hex.length === 1 ? '0' + hex : hex
}

// derived from https://github.com/mrdoob/three.js/blob/dev/src/math/Color.js
export const parseRGBString = (str) => {
  /* eslint-disable no-useless-escape */
  const components = /^((?:rgb|hsl)a?)\(\s*([^\)]*)\)/.exec(str)
  const result = components[2].split(',')

  if (result.length === 3 || result.length === 4) {
    return result.map((n) => parseFloat(n) / 255)
  } else {
    return new Error(`Invalid color string ${str}`)
  }
}
