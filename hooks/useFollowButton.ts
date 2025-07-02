import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function useFollowButton(
  userId: string,
  initialFollowing: boolean,
) {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    initialData: {
      userId,
      following: initialFollowing,
    },
    queryKey: ["following", userId],
    queryFn: async () => {
      const response = await fetch(`/api/user/following/${userId}`);
      const data: { userId: string; following: boolean } =
        await response.json();
      return data;
    },
    staleTime: Infinity,
  });
  const { mutate } = useMutation({
    mutationFn: async () => {
      await fetch(`/api/user/follow/${userId}`, {
        method: data?.following ? "DELETE" : "POST",
      });
    },
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: ["following", userId],
      });
      const previousState = queryClient.getQueryData<{
        following: boolean;
      }>(["following", userId]);

      queryClient.setQueryData<{
        following: boolean;
      }>(["following", userId], {
        following: !previousState?.following,
      });
      return { previousState };
    },
    onError(error, _, context) {
      queryClient.setQueryData(["following", userId], context?.previousState);
      console.error(error);
      toast.error("Something went wrong");
    },
  });

  return {
    data,
    mutate,
  };
}
