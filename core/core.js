// Импорт зависимостей
import { VK, Keyboard } from 'vk-io'
import YAML from 'yaml'

// Импорт системных модулей
import { readFileSync, readdirSync } from 'fs'

// Импорт компонентов ядра
import Logger from './logger.js'

// Импорт конфигураций проекта
const config = YAML.parse(readFileSync('config.yml', 'utf8'))
const project = JSON.parse(readFileSync('package.json', 'utf8'))

// Инициализация vk-io
const vk = new VK({ token: config.longpoll.token, v: config.longpoll.version })

// Сообщение о запуске
Logger.logInfo(`Запуск LoserBot v${project.version}...`)

// Сообщение о записи логов в файл
if (config.logging.log_to_file) Logger.logInfo('Логирование в файл: включено')

// Сообщение в лог о подключении к VK API
Logger.logInfo('Подключение к VK API...')

// Старт получения событий ВК
vk.updates.startPolling().then(() => Logger.logInfo('VK API успешно подключен'))

// Обработка сообщений ВК
vk.updates.on('message_new', ctx => {
	
  // Игнорирование лишних сообщений
  if (!ctx.isChat) return
  if (config.general.active_chats != 'all' && !config.general.active_chats.includes(ctx.chatId)) return

  // Игнорирование лишних сообщений
  if (!ctx.isUser || !ctx.text) return

  // Проверка на наличия пользователя в списке
  if (config.general.active_chats != 'all' && ctx.senderId == config.longpoll.id && !config.general.users_ids.includes(ctx.senderId)) return

  // Проверка источника сообщения (беседа / личные сообщения) (для логирования)
  const is_from_chat = ctx.isChat ? `#${ctx.chatId}: ` : ''

  // Определение команды в payload (для логирования)
  const payload_command = ctx.messagePayload?.command ? `(${ctx.messagePayload?.command})` : ''

  // Сообщение в лог о написании команды
  Logger.logInfo(`${is_from_chat}${ctx.senderId} -> ${ctx.text} ${payload_command}`)

  // Выполнение команды
  ctx.reply(config.general.message)
  Logger.logInfo(`Сообщение отправлено (${ctx.senderId}, ${config.general.message})`)
})

// Обработка ошибок бота -> логирование
process.on('uncaughtException', (error, origin) => Logger.logError(`${origin} -> ${error.stack}`))
