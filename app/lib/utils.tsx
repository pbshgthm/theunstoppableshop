export function onlyUniqueObjects(array: any[], keyName: string) {
  const uniqueKeys: any[] = []
  console.log(array)
  return array.filter(item => uniqueKeys.includes(item[keyName]) ? false : uniqueKeys.push(item[keyName]))
}
