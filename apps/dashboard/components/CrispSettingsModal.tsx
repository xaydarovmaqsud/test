import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import {
  Alert,
  Button,
  Card,
  CircularProgress,
  Divider,
  FormControl,
  FormLabel,
  IconButton,
  List,
  ListItem,
  Modal,
  Option,
  Select,
  Stack,
  Typography,
} from '@mui/joy';
import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import useSWR from 'swr';
import { z } from 'zod';

import { getAgents } from '@app/pages/api/agents';
import { getServiceProviders } from '@app/pages/api/service-providers';

import { fetcher } from '@chaindesk/lib/swr-fetcher';
import { Prisma } from '@chaindesk/prisma';
import useStateReducer from '@chaindesk/ui/hooks/useStateReducer';

type Props = {
  isOpen: boolean;
  handleCloseModal: () => any;
  agentId: string;
};

const Schema = z.object({ agentId: z.string().min(1) });

export default function CrispSettingsModal(props: Props) {
  const { data: session, status } = useSession();
  const [state, setState] = useStateReducer({
    isUpdateLoading: false,
    isDeleteLoading: false,
  });
  const router = useRouter();
  const getCrispIntegrationsQuery = useSWR<
    Prisma.PromiseReturnType<typeof getServiceProviders>
  >(`/api/service-providers?type=crisp&agentId=${props.agentId}`, fetcher);

  const onSubmit = () => {
    window.open(
      `https://app.crisp.chat/initiate/plugin/${process.env.NEXT_PUBLIC_CRISP_PLUGIN_ID}/`,
      '_blank'
    );
  };

  const handleDelete = async (id: string) => {
    try {
      setState({ isDeleteLoading: true });
      await axios.delete(`/api/service-providers/${id}`);
      getCrispIntegrationsQuery.mutate();
    } catch (err) {
      console.log(err);
    } finally {
      setState({ isDeleteLoading: false });
    }
  };

  const isLoading = getCrispIntegrationsQuery.isLoading;

  if (!props.agentId) {
    return null;
  }

  return (
    <Modal
      open={props.isOpen}
      onClose={props.handleCloseModal}
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        p: 2,
      }}
    >
      <Card variant="outlined" sx={{ width: '100%', maxWidth: 400 }}>
        <Typography level="h4">Crisp</Typography>
        <Typography color="neutral" level="title-md">
          Settings
        </Typography>
        <Divider sx={{ my: 2 }}></Divider>

        {isLoading ? (
          <CircularProgress size="sm" sx={{ mx: 'auto' }} />
        ) : (
          <>
            <FormLabel>Active connections</FormLabel>
            {getCrispIntegrationsQuery?.data?.length ? (
              <List>
                {getCrispIntegrationsQuery.data?.map((each, index) => (
                  <ListItem key={index}>
                    <Typography className="truncate">
                      {((each as any)?.config as any)?.domain ||
                        each.externalId}
                    </Typography>

                    <IconButton
                      sx={{ ml: 2 }}
                      color="danger"
                      size="sm"
                      onClick={() => handleDelete(each.id)}
                      disabled={state.isDeleteLoading}
                    >
                      {state.isDeleteLoading ? (
                        <CircularProgress
                          color="neutral"
                          variant="soft"
                          size="sm"
                        />
                      ) : (
                        <CloseRoundedIcon />
                      )}
                    </IconButton>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Alert variant="outlined">
                Not connected to any Crisp website
              </Alert>
            )}

            <form className="flex flex-col">
              <Stack sx={{ ml: 'auto' }} direction={'row'} gap={1}>
                <Button
                  onClick={() => onSubmit()}
                  endDecorator={<ArrowForwardRoundedIcon />}
                  sx={{ mt: 4, ml: 'auto' }}
                  // disabled={!methods.formState.isValid}
                >
                  Connect to Crisp
                </Button>
              </Stack>
            </form>
          </>
        )}
      </Card>
    </Modal>
  );
}
