update public.support_messages as message
set
  sender = 'admin',
  sender_name = coalesce(conversation.handled_by_admin_name, 'Equipo OLFFY')
from public.support_conversations as conversation
where message.conversation_id = conversation.id
  and message.sender = 'system'
  and message.body like 'Para revisar mejor tu caso necesitamos que nos envíes%';
