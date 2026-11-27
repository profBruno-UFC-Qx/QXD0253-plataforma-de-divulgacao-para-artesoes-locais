const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const relativo = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' })

export function formatarPreco(valor: number): string {
  return moeda.format(valor)
}

export function formatarTempoRelativo(iso: string): string {
  const minutos = Math.round((Date.parse(iso) - Date.now()) / 60_000)
  const abs = Math.abs(minutos)
  if (abs < 60) return relativo.format(minutos, 'minute')
  if (abs < 60 * 24) return relativo.format(Math.round(minutos / 60), 'hour')
  return relativo.format(Math.round(minutos / (60 * 24)), 'day')
}

export function iniciais(nome: string): string {
  const partes = nome.split(' ').filter(Boolean)
  const primeira = partes.at(0)?.[0] ?? ''
  const ultima = partes.length > 1 ? (partes.at(-1)?.[0] ?? '') : ''
  return (primeira + ultima).toUpperCase()
}

const dataLonga = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' })

export function formatarData(iso: string): string {
  return dataLonga.format(new Date(iso))
}

export function formatarPeso(kg: number): string {
  return kg < 1 ? `${Math.round(kg * 1000)} g` : `${kg.toLocaleString('pt-BR')} kg`
}

// Confg data "YYYY-MM-DD"
export function formatarDiaEvento(dia: string): string {
  return dataLonga.format(new Date(`${dia}T12:00:00`))
}

export function formatarTelefone(digitos: string): string {
  if (digitos.length === 11) return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`
  if (digitos.length === 10) return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`
  return digitos
}
