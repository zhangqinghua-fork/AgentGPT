import type { Edge, Node } from "reactflow";
import { useEffect, useState } from "react";
import { nanoid } from "nanoid";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import type { Workflow, WorkflowNode } from "../types/workflow";
import { toReactFlowPartial } from "../types/workflow";
import WorkflowApi from "../services/workflow/workflowApi";

export const useWorkflow = (workflowId: string) => {
  const { data: session } = useSession();
  const api = new WorkflowApi(session?.accessToken);

  const { mutateAsync: updateWorkflow } = useMutation(
    async (data: Workflow) => await api.update(workflowId, data)
  );

  const { data: workflow } = useQuery(
    ["workflow", workflowId],
    async () => await api.get(workflowId),
    {
      enabled: !!workflowId && !!session?.accessToken,
    }
  );

  const nodesModel = useState<Node<WorkflowNode>[]>([]);
  const edgesModel = useState<Edge[]>([]);
  const [nodes, setNodes] = nodesModel;
  const [edges, setEdges] = edgesModel;

  useEffect(() => {
    setNodes(workflow?.nodes.map(toReactFlowPartial) ?? []);
    setEdges(workflow?.edges ?? []);
  }, [setNodes, setEdges, workflow]);

  const createNode = () => {
    const ref = nanoid(11);

    setNodes((nodes) => [
      ...(nodes ?? []),
      {
        id: ref,
        type: "custom",
        position: { x: 0, y: 0 },
        data: {
          id: undefined,
          ref: ref,
          pos_x: 0,
          pos_y: 0,
        },
      },
    ]);
  };

  const onSave = async () => {
    await updateWorkflow({
      nodes: nodes.map((n) => ({
        id: n.data.id,
        ref: n.data.ref,
        pos_x: n.position.x,
        pos_y: n.position.y,
      })),
      edges: edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
      })),
    });
  };

  return {
    nodesModel,
    edgesModel,
    saveWorkflow: onSave,
    createNode,
  };
};
