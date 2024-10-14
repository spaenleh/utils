const command = new Deno.Command("gh", {
  args: ["cache", "list", "--json", "id"],
  stdout: "piped",
});
const child = command.spawn();

const decoder = new TextDecoder("utf-8");
// open a file and pipe the subprocess output to it.
for await (const chunk of child.stdout) {
  const value = decoder.decode(chunk);
  const array = JSON.parse(value);
  for (const { id } of array) {
    console.log(id);

    const deleteCmd = new Deno.Command("gh", {
      args: ["cache", "delete", id],

      stdout: "piped",
    });
    deleteCmd.spawn();
  }
  console.log(`----- Done with ${array.length} caches ------`);
}
