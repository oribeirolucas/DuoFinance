-- 0005_storage_avatares.sql — bucket de fotos de perfil
--
-- Suporta a tela de configurações da conta: trocar foto, nome e salário.

-- Bucket público de leitura. A foto de perfil precisa ser carregável por uma
-- tag <img> comum, e URL assinada expiraria no meio da sessão. Em troca, quem
-- tiver o link vê a imagem — por isso o caminho é <uuid do dono>/<aleatório>,
-- que não se adivinha. Nenhum outro dado do app vive aqui.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatares', 'avatares', true,
  2097152,  -- 2 MB: foto de perfil não precisa de mais, e limite no servidor
            -- é o que vale, já que o do formulário o DevTools contorna
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

-- Escrita só na própria pasta. storage.foldername(name) devolve os segmentos
-- do caminho; o primeiro precisa ser o uuid de quem está enviando, senão uma
-- pessoa poderia sobrescrever a foto da outra.
create policy avatares_leitura_publica on storage.objects
  for select to public
  using (bucket_id = 'avatares');

create policy avatares_envio_proprio on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatares'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy avatares_atualizacao_propria on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatares'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatares'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy avatares_remocao_propria on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatares'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
