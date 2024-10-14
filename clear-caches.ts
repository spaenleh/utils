type RepoInfo = {
  nameWithOwner: string;
  name: string;
  description: string;
};

async function getRepo(repo: string): Promise<RepoInfo | null> {
  const command = new Deno.Command("gh", {
    args: ["repo", "view", repo, "--json", "nameWithOwner,name,description"],
    stdout: "piped",
    stderr: "piped",
  });
  command.spawn();
  const out = await command.output();
  const decoder = new TextDecoder("utf-8");
  const errors = decoder.decode(out.stderr);
  if (errors) {
    console.error(`%cErrors:\n${errors}`, "color: red");
    return null;
  }
  const decodedOutput = decoder.decode(out.stdout);
  const repoInfo = JSON.parse(decodedOutput);
  return repoInfo;
}

async function getCacheList(
  repoInfo: RepoInfo
): Promise<{ id: string }[] | null> {
  const command = new Deno.Command("gh", {
    args: [
      "cache",
      "list",
      "--json",
      "id",
      "--sort",
      "last_accessed_at",
      "--order",
      "asc",
      "--repo",
      repoInfo.nameWithOwner,
    ],
    stdout: "piped",
  });
  const child = command.spawn();

  const decoder = new TextDecoder("utf-8");
  const decodedOutput = decoder.decode((await child.output()).stdout);
  try {
    const array = JSON.parse(decodedOutput);
    return array;
  } catch {
    console.log("no caches");
    return null;
  }
}

export async function clearCache(repo: string) {
  // validate that the repo is accessible by the user
  const repoInfo = await getRepo(repo);
  if (!repoInfo) {
    console.log(
      `Repo is not accessible. Ensure that you have access to repo ${repo}`
    );
    return;
  }
  console.log(`Working on repo: ${repoInfo.name} (${repoInfo.nameWithOwner})`);
  const cacheList = await getCacheList(repoInfo);

  if (cacheList && cacheList.length) {
    console.log(``);
    const shouldContinue = confirm(
      `There are ${cacheList.length} caches to remove. Continue?`
    );
    if (shouldContinue) {
      for (const { id } of cacheList) {
        console.log(`Removing cache with id: ${id}`);

        const deleteCmd = new Deno.Command("gh", {
          args: ["cache", "delete", id, "--repo", repoInfo.nameWithOwner],
          stdout: "piped",
        });
        deleteCmd.outputSync();
      }
      console.log(`----- Done with ${cacheList.length} caches ------`);
      return;
    }
    console.log("Ok, exiting now.");
  }
}
