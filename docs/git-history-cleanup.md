# Pulizia della cronologia git

La punta del branch `portfolio-ready` non contiene più `client/.env`, `client/.next` né la chiave Stripe che era scritta nella pagina ordine. Quei blob restano nei commit già pubblicati su `master`.

Questo documento spiega come rimuoverli. **Non è stato eseguito** durante la preparazione del portfolio: un filter-repo riscrive gli hash e richiede un force-push di `master`.

Finché la cronologia non è riscritta, considera compromessa ogni chiave che sia passata dal repository. Revocala dalla dashboard Stripe e creane una nuova. Non incollare la chiave nuova in un file tracciato da git.

## Prima di iniziare

- Avvisa chi ha un clone o un fork: dopo il force-push dovranno rifare il clone.
- Lavora su un clone nuovo, fuori dalla copia che usi ogni giorno.
- Installa [git-filter-repo](https://github.com/newren/git-filter-repo). Su Windows, con Python: `pip install git-filter-repo`.
- Fai un mirror di backup: `git clone --mirror git@github.com:PooriaEshghi/ticketing.git ticketing-backup.git`.

## 1. Elenco locale delle stringhe da sostituire

Crea un file **fuori dal repository**, per esempio `C:\Temp\footlight-replacements.txt`. Non committarlo e non aprirlo in una PR.

Da un clone che contiene ancora la storia vecchia, estrai le stringhe `sk_test_…` e `pk_test_…` e scrivile nel file nel formato di filter-repo:

```text
<valore-esatto>==>REVOKED
```

Una riga per la chiave segreta, una per la chiave pubblicabile. Il valore esatto è quello presente nei blob, senza virgolette e senza il nome della variabile. Puoi leggerlo da un checkout di `master` in `client/.env` e in `client/pages/orders/[orderId].js`, poi chiudere quei file.

Controlla di non avere copiato il file dentro il repository:

```powershell
git status --short
```

Non deve comparire il file delle sostituzioni.

## 2. Rimuovere i path e sostituire le stringhe

Nel clone dedicato:

```powershell
git filter-repo --invert-paths --path client/.env --path client/.next --replace-text C:\Temp\footlight-replacements.txt
```

`--invert-paths` cancella quei path da ogni commit. `--replace-text` sostituisce la chiave anche dove era hardcoded nel sorgente, così non sopravvive nella pagina ordine dei commit vecchi.

`git filter-repo` rimuove il remote `origin` di proposito. Riagganciaralo solo quando hai verificato il risultato:

```powershell
git remote add origin git@github.com:PooriaEshghi/ticketing.git
git log -S "sk_test_" --oneline
git log -S "pk_test_" --oneline
```

I due comandi `git log -S` non devono stampare commit. Cerca anche il nome del file:

```powershell
git log --all --oneline -- client/.env client/.next
```

Non deve restare alcun commit.

## 3. Pubblicare la storia riscritta

Questo passaggio **riscrive `master` sul remote**. Non fa parte del branch `portfolio-ready` e va fatto solo dopo una decisione esplicita.

```powershell
git push --force --all origin
git push --force --tags origin
```

Poi, su GitHub:

- In Settings → Secrets, ruota qualunque segreto che fosse derivato dai valori vecchi.
- Chiedi a Stripe di disabilitare le chiavi vecchie, se non l'hai già fatto.
- Invalida i clone locali: `git fetch origin` e reset, oppure clona di nuovo. Un semplice `git pull` sul vecchio `master` non si concilia con la storia riscritta.

## Cosa non fare

- Non usare `git filter-branch`: è lento e facile da sbagliare.
- Non mettere `replacements.txt` nel repository, in una gist o nella descrizione della pull request.
- Non force-pushare se qualcun altro sta pubblicando commit su `master` in quel momento. Metti il repository in sola lettura per qualche minuto, poi esegui il push.
